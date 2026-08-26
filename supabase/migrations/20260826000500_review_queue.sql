-- Oracle Page — 관리자 승인 큐
--
-- 그동안 마감된 예언은 선택률 가중 랜덤으로 결과가 정해졌다. 포인트가 오가는
-- 결정을 주사위에 맡긴 셈이라, 마감과 정산을 분리한다.
--
--   live → awaiting (마감, 정답 대기) → closed (정산 완료)
--                        └────────────→ voided (판정 불가, 전원 환불)
--
-- 관리자가 확정하기 전까지는 아무 포인트도 움직이지 않는다.

-- ────────────────────────────────────────
-- 상태 확장
-- ────────────────────────────────────────
alter table public.oracles drop constraint if exists oracles_status_check;
alter table public.oracles add constraint oracles_status_check
  check (status in ('live', 'upcoming', 'awaiting', 'closed', 'voided'));

alter table public.bets drop constraint if exists bets_status_check;
alter table public.bets add constraint bets_status_check
  check (status in ('pending', 'won', 'lost', 'refunded'));

-- 마감된 예언이 대기 큐에 얼마나 오래 있었는지 보려면 필요하다
alter table public.oracles add column if not exists awaiting_since timestamptz;

create index if not exists oracles_awaiting_idx
  on public.oracles (awaiting_since)
  where status = 'awaiting';

-- ────────────────────────────────────────
-- 결재 기록 : 누가, 언제, 무엇을, 왜
-- ────────────────────────────────────────
create table public.settlement_reviews (
  id                uuid primary key default gen_random_uuid(),
  oracle_id         uuid not null references public.oracles on delete cascade,
  decided_by        uuid references public.profiles (id) on delete set null,
  action            text not null check (action in ('settle', 'void')),
  winning_option_id uuid references public.bet_options (id) on delete set null,
  note              text not null default '',
  affected_bets     integer not null default 0,
  points_moved      bigint  not null default 0,
  decided_at        timestamptz not null default now(),

  -- 정산이면 정답이 있어야 하고, 무효면 없어야 한다
  constraint settlement_reviews_option_matches_action check (
    (action = 'settle' and winning_option_id is not null)
    or (action = 'void' and winning_option_id is null)
  )
);

create index settlement_reviews_oracle_idx on public.settlement_reviews (oracle_id, decided_at desc);

alter table public.settlement_reviews enable row level security;

create policy "결재 기록은 누구나 볼 수 있다"
  on public.settlement_reviews for select
  using (true);
-- INSERT 정책 없음 → settle_oracle() / void_oracle() 만 기록한다

-- ────────────────────────────────────────
-- 앱 설정 : 정산 모드
-- ────────────────────────────────────────
create table public.app_settings (
  id              boolean primary key default true check (id),
  -- 'review' : 마감 후 관리자가 확정해야 정산된다 (기본값)
  -- 'auto'   : 마감되면 선택률 가중 랜덤으로 즉시 정산한다 (데모·테스트용)
  settlement_mode text not null default 'review'
                    check (settlement_mode in ('review', 'auto')),
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.profiles (id) on delete set null
);

insert into public.app_settings (id) values (true);

alter table public.app_settings enable row level security;

create policy "설정은 누구나 볼 수 있다"
  on public.app_settings for select
  using (true);

create policy "설정은 관리자만 바꾼다"
  on public.app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

create function public.admin_set_settlement_mode(p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = 'insufficient_privilege';
  end if;
  if p_mode not in ('review', 'auto') then
    raise exception '알 수 없는 정산 모드입니다: %', p_mode using errcode = 'check_violation';
  end if;

  update public.app_settings
     set settlement_mode = p_mode, updated_at = now(), updated_by = auth.uid()
   where id;
end;
$$;

-- ────────────────────────────────────────
-- 무효 처리 : 판정 불가한 예언을 전원 환불한다
-- ────────────────────────────────────────
create function public.void_oracle(p_oracle_id uuid, p_note text default '')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_oracle   public.oracles;
  v_bet      record;
  v_refunded integer := 0;
  v_moved    bigint  := 0;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_oracle from public.oracles where id = p_oracle_id for update;
  if not found then
    raise exception '예언을 찾을 수 없습니다.' using errcode = 'no_data_found';
  end if;
  if v_oracle.status = 'closed' then
    raise exception '이미 정산된 예언은 무효 처리할 수 없습니다.' using errcode = 'check_violation';
  end if;

  update public.oracles
     set status = 'voided', winning_option_id = null, settled_at = now(), awaiting_since = null
   where id = p_oracle_id;

  -- 승부가 아니었으므로 원금만 돌려준다. 연승·적중률은 건드리지 않는다.
  for v_bet in
    select * from public.bets where oracle_id = p_oracle_id and status = 'pending'
  loop
    update public.bets
       set status = 'refunded', payout = v_bet.amount, settled_at = now()
     where id = v_bet.id;

    perform set_config('app.trusted_write', 'on', true);
    update public.profiles p
       set points     = p.points + v_bet.amount,
           total_bets = greatest(0, p.total_bets - 1),
           grade_id   = case when p.grade_override then p.grade_id
                             else public.grade_by_points(p.points + v_bet.amount) end
     where p.id = v_bet.user_id;
    perform set_config('app.trusted_write', 'off', true);

    insert into public.notifications (user_id, type, title, body, oracle_id)
    values (
      v_bet.user_id,
      'system',
      '예언이 무효 처리되었습니다',
      '"' || v_oracle.title || '" 은(는) 판정할 수 없어 무효 처리되었습니다. '
        || v_bet.amount || 'P를 돌려드렸습니다.'
        || case when coalesce(p_note, '') = '' then '' else ' (사유: ' || p_note || ')' end,
      p_oracle_id
    );

    v_refunded := v_refunded + 1;
    v_moved := v_moved + v_bet.amount;
  end loop;

  insert into public.settlement_reviews
    (oracle_id, decided_by, action, note, affected_bets, points_moved)
  values (p_oracle_id, auth.uid(), 'void', coalesce(p_note, ''), v_refunded, v_moved);

  return v_refunded;
end;
$$;

-- ────────────────────────────────────────
-- settle_oracle 재정의 : 관리자만, 결재 기록 남김
-- ────────────────────────────────────────
drop function if exists public.settle_oracle(uuid, uuid);

create function public.settle_oracle(
  p_oracle_id         uuid,
  p_winning_option_id uuid,
  p_note              text default '',
  p_by_system         boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_oracle  public.oracles;
  v_bet     record;
  v_won     boolean;
  v_payout  integer;
  v_settled integer := 0;
  v_moved   bigint  := 0;
  v_old_pts integer;
  v_new_pts integer;
  v_streak  integer;
  v_best    integer;
begin
  -- 시스템(자동 모드)에서 부르는 경우가 아니면 관리자여야 한다
  if not p_by_system and not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_oracle from public.oracles where id = p_oracle_id for update;
  if not found then
    raise exception '예언을 찾을 수 없습니다.' using errcode = 'no_data_found';
  end if;
  if v_oracle.status = 'voided' then
    raise exception '무효 처리된 예언은 정산할 수 없습니다.' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.bet_options
                  where id = p_winning_option_id and oracle_id = p_oracle_id) then
    raise exception '이 예언의 선택지가 아닙니다.' using errcode = 'check_violation';
  end if;

  update public.oracles
     set status = 'closed', winning_option_id = p_winning_option_id,
         settled_at = now(), awaiting_since = null
   where id = p_oracle_id;

  -- 연승은 배팅한 순서대로 누적돼야 하므로 placed_at 오름차순
  for v_bet in
    select * from public.bets
     where oracle_id = p_oracle_id and status = 'pending'
     order by placed_at
  loop
    v_won := v_bet.option_id = p_winning_option_id;
    v_payout := case when v_won
      then floor(v_bet.amount * v_bet.odds * (1 + v_bet.grade_bonus + v_bet.streak_bonus))
      else 0 end;

    update public.bets
       set status = case when v_won then 'won' else 'lost' end,
           payout = v_payout,
           settled_at = now()
     where id = v_bet.id;

    select points, current_streak, best_streak
      into v_old_pts, v_streak, v_best
      from public.profiles where id = v_bet.user_id for update;

    v_new_pts := v_old_pts + v_payout;
    v_streak  := case when v_won then v_streak + 1 else 0 end;
    v_best    := greatest(v_best, v_streak);

    perform set_config('app.trusted_write', 'on', true);
    update public.profiles p
       set points         = v_new_pts,
           current_streak = v_streak,
           best_streak    = v_best,
           won_bets       = (select count(*) from public.bets
                              where user_id = v_bet.user_id and status = 'won'),
           -- 무효 환불은 승부가 아니므로 적중률 분모에서 뺀다
           accuracy       = coalesce((
                              select round(count(*) filter (where status = 'won') * 100.0
                                           / nullif(count(*), 0))
                                from public.bets
                               where user_id = v_bet.user_id
                                 and status in ('won', 'lost')
                            ), 0),
           grade_id       = case when p.grade_override then p.grade_id
                                 else public.grade_by_points(v_new_pts) end
     where p.id = v_bet.user_id;
    perform set_config('app.trusted_write', 'off', true);

    insert into public.notifications (user_id, type, title, body, oracle_id)
    values (
      v_bet.user_id,
      'bet_result',
      case when v_won then '예언 적중! 🎉' else '예언 실패 😢' end,
      case when v_won
        then '"' || v_oracle.title || '" 적중! ' || v_payout || 'P를 획득했습니다.'
        else '"' || v_oracle.title || '" 예언이 빗나갔습니다. 다음엔 꼭!' end,
      p_oracle_id
    );

    perform public.notify_grade_up(v_bet.user_id, v_old_pts, v_new_pts);
    v_settled := v_settled + 1;
    v_moved := v_moved + v_payout;
  end loop;

  insert into public.settlement_reviews
    (oracle_id, decided_by, action, winning_option_id, note, affected_bets, points_moved)
  values (p_oracle_id, auth.uid(), 'settle', p_winning_option_id,
          coalesce(p_note, ''), v_settled, v_moved);

  return v_settled;
end;
$$;

-- ────────────────────────────────────────
-- 마감 처리 : 정산하지 않고 승인 큐로 넘긴다
-- ────────────────────────────────────────
drop function if exists public.settle_due_oracles();

/**
 * 마감 시각이 지난 예언을 처리한다. pg_cron 이 매분 호출한다.
 *
 * - review 모드(기본) : 승인 큐로 넘기기만 한다. 포인트는 움직이지 않는다.
 * - auto 모드         : 선택률 가중 랜덤으로 즉시 정산한다 (데모·테스트용)
 */
create function public.close_due_oracles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode   text;
  v_oracle record;
  v_winner uuid;
  v_count  integer := 0;
begin
  select settlement_mode into v_mode from public.app_settings where id;

  for v_oracle in
    select id from public.oracles
     where status in ('live', 'upcoming') and ends_at <= now()
     order by ends_at
     limit 200
  loop
    if v_mode = 'auto' then
      select id into v_winner
        from public.bet_options
       where oracle_id = v_oracle.id
       order by random() * greatest(1, percentage) desc
       limit 1;

      if v_winner is not null then
        perform public.settle_oracle(v_oracle.id, v_winner, '자동 정산', true);
      end if;
    else
      update public.oracles
         set status = 'awaiting', awaiting_since = now()
       where id = v_oracle.id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ────────────────────────────────────────
-- 실행 권한
-- ────────────────────────────────────────
revoke all on function
  public.void_oracle(uuid, text),
  public.settle_oracle(uuid, uuid, text, boolean),
  public.close_due_oracles(),
  public.admin_set_settlement_mode(text)
from public, anon;

grant execute on function
  public.void_oracle(uuid, text),
  public.settle_oracle(uuid, uuid, text, boolean),
  public.admin_set_settlement_mode(text)
to authenticated;

-- close_due_oracles 는 크론(서버)만 부른다

-- ────────────────────────────────────────
-- 크론 교체
-- ────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform extensions.cron.unschedule('settle-due-oracles')
      where exists (select 1 from extensions.cron.job where jobname = 'settle-due-oracles');

    perform extensions.cron.unschedule('close-due-oracles')
      where exists (select 1 from extensions.cron.job where jobname = 'close-due-oracles');

    perform extensions.cron.schedule(
      'close-due-oracles',
      '* * * * *',
      $cron$ select public.close_due_oracles(); $cron$
    );

    raise notice 'pg_cron 스케줄 교체 완료: close-due-oracles (매분)';
  else
    raise notice 'pg_cron 이 없어 스케줄을 건너뜁니다.';
  end if;
end;
$$;
