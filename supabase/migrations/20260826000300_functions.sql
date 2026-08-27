-- Oracle Page — 포인트가 걸린 동작들
--
-- 클라이언트는 이 함수들을 통해서만 포인트·전적을 바꿀 수 있다.
-- 계산 규칙은 앱의 lib/grades.ts · lib/betting.ts · lib/settlement.ts 와 같아야 한다.

-- ────────────────────────────────────────
-- 등급 규칙 (lib/grades.ts 와 동일하게 유지할 것)
-- ────────────────────────────────────────

create function public.grade_rank(p_grade_id text)
returns integer
language sql
immutable
as $$
  select case p_grade_id
    when 'magikarp'  then 1
    when 'bulbasaur' then 2
    when 'pikachu'   then 3
    when 'growlithe' then 4
    when 'mew'       then 5
    when 'mewtwo'    then 6
    when 'arceus'    then 7
    else 1
  end;
$$;

create function public.grade_by_points(p_points integer)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_thresholds jsonb;
  v_grade      text := 'magikarp';
  v_id         text;
begin
  select thresholds into v_thresholds from public.grade_settings where id;

  -- rank 오름차순으로 훑으며 도달한 마지막 등급을 고른다
  foreach v_id in array array['magikarp','bulbasaur','pikachu','growlithe','mew','mewtwo','arceus']
  loop
    if p_points >= coalesce((v_thresholds ->> v_id)::integer, 0) then
      v_grade := v_id;
    end if;
  end loop;

  return v_grade;
end;
$$;

/** 등급별 배당 보너스 (0.15 = +15%) */
create function public.grade_bonus_rate(p_grade_id text)
returns numeric
language sql
immutable
as $$
  select (public.grade_rank(p_grade_id) - 1) * 0.05;
$$;

/** 연승 구간별 배당 보너스. 3연승부터 붙는다. */
create function public.streak_bonus_rate(p_streak integer)
returns numeric
language sql
immutable
as $$
  select case
    when p_streak >= 7 then 0.15
    when p_streak >= 5 then 0.10
    when p_streak >= 3 then 0.05
    else 0
  end;
$$;

/** 등급별 하루 예언 생성 한도. NULL 은 무제한. */
create function public.daily_oracle_limit(p_grade_id text)
returns integer
language sql
immutable
as $$
  select case public.grade_rank(p_grade_id)
    when 1 then 0
    when 2 then 3
    when 3 then 5
    when 4 then 10
    else null
  end;
$$;

/** 등급별 일일 출석 보너스 */
create function public.daily_bonus_amount(p_grade_id text)
returns integer
language sql
immutable
as $$
  select 200 + (public.grade_rank(p_grade_id) - 1) * 150;
$$;

-- ────────────────────────────────────────
-- 선택률·배당 재계산 (lib/betting.ts 와 동일: 하우스 엣지 10%, 최대잔여법)
-- ────────────────────────────────────────
create function public.recalc_options(p_oracle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total   integer;
  v_count   integer;
  v_left    integer;
  r         record;
begin
  select coalesce(sum(total_bets), 0), count(*)
    into v_total, v_count
    from public.bet_options where oracle_id = p_oracle_id;

  if v_count = 0 then
    return;
  end if;

  if v_total = 0 then
    -- 배팅이 없으면 균등 분배. 나머지는 앞쪽 선택지에 1%씩.
    v_left := 100 - (100 / v_count) * v_count;
    update public.bet_options
       set percentage = (100 / v_count) + case when position < v_left then 1 else 0 end
     where oracle_id = p_oracle_id;
  else
    -- 내림값을 먼저 주고, 남은 몫을 소수부가 큰 순서로 1%씩 배분한다.
    update public.bet_options
       set percentage = floor(total_bets::numeric * 100 / v_total)
     where oracle_id = p_oracle_id;

    select 100 - coalesce(sum(percentage), 0) into v_left
      from public.bet_options where oracle_id = p_oracle_id;

    for r in
      select id
        from public.bet_options
       where oracle_id = p_oracle_id
       order by (total_bets::numeric * 100 / v_total)
                - floor(total_bets::numeric * 100 / v_total) desc,
                position
       limit greatest(v_left, 0)
    loop
      update public.bet_options set percentage = percentage + 1 where id = r.id;
    end loop;
  end if;

  -- 배당 = 하우스 엣지 / 확률, 최소 1.05
  update public.bet_options
     set odds = greatest(1.05, round(0.9 / (least(99, greatest(1, percentage))::numeric / 100), 2))
   where oracle_id = p_oracle_id;
end;
$$;

-- ────────────────────────────────────────
-- 승급 알림 (포인트 변화로 등급이 올랐을 때만)
-- ────────────────────────────────────────
create function public.notify_grade_up(p_user_id uuid, p_old_points integer, p_new_points integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before text := public.grade_by_points(p_old_points);
  v_after  text := public.grade_by_points(p_new_points);
begin
  if public.grade_rank(v_after) > public.grade_rank(v_before) then
    insert into public.notifications (user_id, type, title, body)
    values (p_user_id, 'grade_up', '등급 승급! ' || v_after, '축하합니다! 새로운 등급으로 승급했습니다.');
  end if;
end;
$$;

-- ────────────────────────────────────────
-- 배팅
-- ────────────────────────────────────────
create function public.place_bet(p_option_id uuid, p_amount integer)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_profile  public.profiles;
  v_option   public.bet_options;
  v_oracle   public.oracles;
  v_bet      public.bets;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.' using errcode = 'insufficient_privilege';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception '배팅 금액은 1P 이상이어야 합니다.' using errcode = 'check_violation';
  end if;

  -- 같은 예언에 동시에 두 번 들어오지 못하도록 프로필 행을 잠근다
  select * into v_profile from public.profiles where id = v_uid for update;
  if v_profile.is_banned then
    raise exception '제재 중인 계정은 참여할 수 없습니다.' using errcode = 'insufficient_privilege';
  end if;
  if v_profile.points < p_amount then
    raise exception '포인트가 부족합니다.' using errcode = 'check_violation';
  end if;

  select * into v_option from public.bet_options where id = p_option_id;
  if not found then
    raise exception '선택지를 찾을 수 없습니다.' using errcode = 'no_data_found';
  end if;

  select * into v_oracle from public.oracles where id = v_option.oracle_id for update;
  if v_oracle.status = 'closed' then
    raise exception '이미 종료된 예언입니다.' using errcode = 'check_violation';
  end if;
  if v_oracle.ends_at <= now() then
    raise exception '마감된 예언입니다.' using errcode = 'check_violation';
  end if;

  -- 배당과 보너스를 이 시점 값으로 고정한다
  insert into public.bets (user_id, oracle_id, option_id, amount, odds, grade_bonus, streak_bonus)
  values (
    v_uid, v_oracle.id, v_option.id, p_amount, v_option.odds,
    public.grade_bonus_rate(v_profile.grade_id),
    public.streak_bonus_rate(v_profile.current_streak)
  )
  returning * into v_bet;

  -- 포인트 차감 + 참여 수
  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
     set points     = points - p_amount,
         total_bets = total_bets + 1,
         grade_id   = case when grade_override then grade_id
                           else public.grade_by_points(points - p_amount) end,
         last_active = now()
   where id = v_uid;
  perform set_config('app.trusted_write', 'off', true);

  -- 예언 통계
  update public.bet_options set total_bets = total_bets + 1 where id = v_option.id;
  update public.oracles
     set total_pool         = total_pool + p_amount,
         total_participants = total_participants + 1
   where id = v_oracle.id;

  perform public.recalc_options(v_oracle.id);

  return v_bet;
end;
$$;

/** 마감 전이라면 배팅을 되돌린다. */
create function public.cancel_bet(p_bet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_bet    public.bets;
  v_oracle public.oracles;
begin
  select * into v_bet from public.bets where id = p_bet_id and user_id = v_uid for update;
  if not found then
    raise exception '배팅을 찾을 수 없습니다.' using errcode = 'no_data_found';
  end if;
  if v_bet.status <> 'pending' then
    raise exception '이미 정산된 배팅은 취소할 수 없습니다.' using errcode = 'check_violation';
  end if;

  select * into v_oracle from public.oracles where id = v_bet.oracle_id for update;
  if v_oracle.status = 'closed' or v_oracle.ends_at <= now() then
    raise exception '마감된 예언은 취소할 수 없습니다.' using errcode = 'check_violation';
  end if;

  delete from public.bets where id = v_bet.id;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
     set points     = points + v_bet.amount,
         total_bets = greatest(0, total_bets - 1),
         grade_id   = case when grade_override then grade_id
                           else public.grade_by_points(points + v_bet.amount) end
   where id = v_uid;
  perform set_config('app.trusted_write', 'off', true);

  update public.bet_options
     set total_bets = greatest(0, total_bets - 1) where id = v_bet.option_id;
  update public.oracles
     set total_pool         = greatest(0, total_pool - v_bet.amount),
         total_participants = greatest(0, total_participants - 1)
   where id = v_oracle.id;

  perform public.recalc_options(v_oracle.id);
end;
$$;

-- ────────────────────────────────────────
-- 정산
-- ────────────────────────────────────────

/**
 * 예언 하나를 정산한다. 이미 정산된 배팅은 건드리지 않으므로
 * 여러 번 불러도 이중 지급되지 않는다.
 */
create function public.settle_oracle(p_oracle_id uuid, p_winning_option_id uuid)
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
  v_old_pts integer;
  v_new_pts integer;
  v_streak  integer;
  v_best    integer;
begin
  select * into v_oracle from public.oracles where id = p_oracle_id for update;
  if not found then
    raise exception '예언을 찾을 수 없습니다.' using errcode = 'no_data_found';
  end if;
  if not exists (select 1 from public.bet_options
                  where id = p_winning_option_id and oracle_id = p_oracle_id) then
    raise exception '이 예언의 선택지가 아닙니다.' using errcode = 'check_violation';
  end if;

  update public.oracles
     set status = 'closed', winning_option_id = p_winning_option_id, settled_at = now()
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
           accuracy       = coalesce((
                              select round(count(*) filter (where status = 'won') * 100.0
                                           / nullif(count(*), 0))
                                from public.bets
                               where user_id = v_bet.user_id and status <> 'pending'
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
  end loop;

  return v_settled;
end;
$$;

/**
 * 마감 시각이 지난 예언을 모두 정산한다. pg_cron 이 매분 호출한다.
 * 정답은 선택률 가중 랜덤 — 다수 의견이 맞을 확률이 높되 확정은 아니게.
 *
 * NOTE: 실서비스에서는 이 자리가 관리자 승인 큐로 대체되어야 한다.
 *       지금은 결과가 무작위다.
 */
create function public.settle_due_oracles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_oracle  record;
  v_winner  uuid;
  v_count   integer := 0;
begin
  for v_oracle in
    select id from public.oracles
     where status <> 'closed' and ends_at <= now()
     order by ends_at
     limit 200
  loop
    -- 선택률을 가중치로 하나 뽑는다 (최소 1 이라 아무도 안 고른 쪽도 가능성은 있다)
    select id into v_winner
      from public.bet_options
     where oracle_id = v_oracle.id
     order by random() * greatest(1, percentage) desc
     limit 1;

    if v_winner is not null then
      perform public.settle_oracle(v_oracle.id, v_winner);
      v_count := v_count + 1;
    end if;
  end loop;

  return v_count;
end;
$$;

-- ────────────────────────────────────────
-- 일일 보너스 / 재기 지원금
-- ────────────────────────────────────────
create function public.claim_daily_bonus()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_amount  integer;
begin
  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception '로그인이 필요합니다.' using errcode = 'insufficient_privilege';
  end if;

  if v_profile.last_daily_bonus_at is not null
     and v_profile.last_daily_bonus_at::date = (now() at time zone 'Asia/Seoul')::date then
    raise exception '오늘 보너스는 이미 받았습니다.' using errcode = 'check_violation';
  end if;

  v_amount := public.daily_bonus_amount(v_profile.grade_id);

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
     set points              = points + v_amount,
         last_daily_bonus_at = now(),
         grade_id            = case when grade_override then grade_id
                                    else public.grade_by_points(points + v_amount) end
   where id = v_uid;
  perform set_config('app.trusted_write', 'off', true);

  insert into public.notifications (user_id, type, title, body)
  values (v_uid, 'system', '일일 보너스 +' || v_amount || 'P 🎁',
          '등급 보너스를 받았습니다. 내일 또 받을 수 있어요!');

  perform public.notify_grade_up(v_uid, v_profile.points, v_profile.points + v_amount);

  return v_amount;
end;
$$;

/** 포인트가 바닥나면 최소 잔고까지 채워준다. 게임이 끝나버리지 않도록. */
create function public.claim_relief()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_points  integer;
  v_floor   constant integer := 100;
  v_thresh  constant integer := 50;
begin
  select points into v_points from public.profiles where id = v_uid for update;
  if not found then
    raise exception '로그인이 필요합니다.' using errcode = 'insufficient_privilege';
  end if;
  if v_points >= v_thresh then
    raise exception '아직 재기 지원금을 받을 수 없습니다.' using errcode = 'check_violation';
  end if;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
     set points   = v_floor,
         grade_id = case when grade_override then grade_id
                         else public.grade_by_points(v_floor) end
   where id = v_uid;
  perform set_config('app.trusted_write', 'off', true);

  insert into public.notifications (user_id, type, title, body)
  values (v_uid, 'system', '재기 지원금 지급 💪',
          '포인트가 ' || v_floor || 'P로 채워졌습니다. 다시 예언해보세요!');

  return v_floor - v_points;
end;
$$;

-- ────────────────────────────────────────
-- 예언 생성 (등급별 일일 한도를 서버에서 확인)
-- ────────────────────────────────────────
create function public.create_oracle(
  p_title       text,
  p_description text,
  p_category    text,
  p_options     text[],
  p_ends_at     timestamptz,
  p_tags        text[] default '{}'
)
returns public.oracles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile public.profiles;
  v_limit   integer;
  v_today   integer;
  v_oracle  public.oracles;
  v_label   text;
  v_pos     smallint := 0;
begin
  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception '로그인이 필요합니다.' using errcode = 'insufficient_privilege';
  end if;
  if v_profile.is_banned then
    raise exception '제재 중인 계정은 예언을 만들 수 없습니다.' using errcode = 'insufficient_privilege';
  end if;

  v_limit := public.daily_oracle_limit(v_profile.grade_id);
  if v_limit = 0 then
    raise exception '이 등급은 예언을 만들 수 없습니다.' using errcode = 'insufficient_privilege';
  end if;

  if v_limit is not null then
    select count(*) into v_today
      from public.oracles
     where creator_id = v_uid
       and created_at >= date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
    if v_today >= v_limit then
      raise exception '오늘의 예언 생성 한도(%개)를 모두 사용했습니다.', v_limit
        using errcode = 'check_violation';
    end if;
  end if;

  if array_length(p_options, 1) not between 2 and 4 then
    raise exception '선택지는 2~4개여야 합니다.' using errcode = 'check_violation';
  end if;
  if p_ends_at <= now() then
    raise exception '마감 시각은 미래여야 합니다.' using errcode = 'check_violation';
  end if;

  insert into public.oracles (title, description, category, ends_at, tags,
                              creator_id, creator_name, creator_avatar)
  values (p_title, p_description, p_category, p_ends_at, p_tags,
          v_uid, v_profile.name, v_profile.avatar)
  returning * into v_oracle;

  foreach v_label in array p_options loop
    insert into public.bet_options (oracle_id, label, position)
    values (v_oracle.id, v_label, v_pos);
    v_pos := v_pos + 1;
  end loop;

  perform public.recalc_options(v_oracle.id);

  return v_oracle;
end;
$$;

-- ────────────────────────────────────────
-- 관리자
-- ────────────────────────────────────────
create function public.admin_update_profile(
  p_user_id        uuid,
  p_points         integer default null,
  p_grade_id       text    default null,
  p_grade_override boolean default null,
  p_is_banned      boolean default null,
  p_ban_reason     text    default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = 'insufficient_privilege';
  end if;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
     set points         = coalesce(p_points, points),
         grade_id       = coalesce(p_grade_id, grade_id),
         grade_override = coalesce(p_grade_override, grade_override),
         is_banned      = coalesce(p_is_banned, is_banned),
         ban_reason     = case when p_is_banned is false then null
                               else coalesce(p_ban_reason, ban_reason) end
   where id = p_user_id
  returning * into v_profile;
  perform set_config('app.trusted_write', 'off', true);

  return v_profile;
end;
$$;

/** 등급 임계값 변경. 수동 지정되지 않은 유저의 등급을 즉시 재계산한다. */
create function public.admin_set_thresholds(p_thresholds jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 사용할 수 있습니다.' using errcode = 'insufficient_privilege';
  end if;

  update public.grade_settings
     set thresholds = p_thresholds, updated_at = now(), updated_by = auth.uid()
   where id;

  perform set_config('app.trusted_write', 'on', true);
  update public.profiles
     set grade_id = public.grade_by_points(points)
   where not grade_override;
  perform set_config('app.trusted_write', 'off', true);
end;
$$;

-- ────────────────────────────────────────
-- 실행 권한 : 로그인한 유저에게만
-- ────────────────────────────────────────
revoke all on function
  public.place_bet(uuid, integer),
  public.cancel_bet(uuid),
  public.claim_daily_bonus(),
  public.claim_relief(),
  public.create_oracle(text, text, text, text[], timestamptz, text[]),
  public.settle_oracle(uuid, uuid),
  public.settle_due_oracles(),
  public.admin_update_profile(uuid, integer, text, boolean, boolean, text),
  public.admin_set_thresholds(jsonb)
from public, anon;

grant execute on function
  public.place_bet(uuid, integer),
  public.cancel_bet(uuid),
  public.claim_daily_bonus(),
  public.claim_relief(),
  public.create_oracle(text, text, text, text[], timestamptz, text[]),
  public.settle_oracle(uuid, uuid),
  public.admin_update_profile(uuid, integer, text, boolean, boolean, text),
  public.admin_set_thresholds(jsonb)
to authenticated;

-- settle_due_oracles 는 크론(서버)만 부른다
