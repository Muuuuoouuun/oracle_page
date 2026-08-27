-- Oracle Page — Row Level Security
--
-- 핵심: 포인트·전적처럼 값이 걸린 컬럼은 클라이언트가 절대 직접 쓸 수 없다.
-- 프로필 UPDATE 권한은 주되, 그런 컬럼이 바뀌면 거부하는 트리거를 둔다.
-- 실제 변경은 SECURITY DEFINER 함수(20260826000300_functions.sql)를 통해서만 일어난다.

alter table public.profiles       enable row level security;
alter table public.oracles        enable row level security;
alter table public.bet_options    enable row level security;
alter table public.bets           enable row level security;
alter table public.comments       enable row level security;
alter table public.comment_likes  enable row level security;
alter table public.follows        enable row level security;
alter table public.notifications  enable row level security;
alter table public.grade_settings enable row level security;

-- ────────────────────────────────────────
-- 헬퍼
-- ────────────────────────────────────────

-- 관리자 여부. profiles 를 다시 조회하므로 RLS 재귀를 피하려 SECURITY DEFINER.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 제재된 유저인지. 밴이면 쓰기를 전부 막는다.
create function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_banned from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────
create policy "프로필은 누구나 볼 수 있다"
  on public.profiles for select
  using (true);

create policy "내 프로필만 수정할 수 있다"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "관리자는 모든 프로필을 수정할 수 있다"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- 값이 걸린 컬럼을 클라이언트가 못 바꾸게 막는다.
-- (관리자 조정도 admin_update_profile() 함수를 거치게 해서 감사 가능하게 둔다)
create function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 서버 함수에서 온 변경이면 통과 (아래 함수들이 이 설정을 켜고 호출한다)
  if current_setting('app.trusted_write', true) = 'on' then
    return new;
  end if;

  if new.points          is distinct from old.points
     or new.accuracy     is distinct from old.accuracy
     or new.total_bets   is distinct from old.total_bets
     or new.won_bets     is distinct from old.won_bets
     or new.current_streak is distinct from old.current_streak
     or new.best_streak  is distinct from old.best_streak
     or new.role         is distinct from old.role
     or new.is_banned    is distinct from old.is_banned
     or new.last_daily_bonus_at is distinct from old.last_daily_bonus_at
  then
    raise exception '포인트·전적·권한은 직접 수정할 수 없습니다. 해당 기능의 함수를 사용하세요.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- ────────────────────────────────────────
-- oracles / bet_options
-- ────────────────────────────────────────
create policy "예언은 누구나 볼 수 있다"
  on public.oracles for select
  using (true);

-- 생성은 create_oracle() 함수로만 (등급별 일일 한도를 서버에서 확인해야 한다)
create policy "관리자는 예언을 수정할 수 있다"
  on public.oracles for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "선택지는 누구나 볼 수 있다"
  on public.bet_options for select
  using (true);

-- ────────────────────────────────────────
-- bets : 남의 배팅 내역은 보이지 않는다.
-- 집계(참여자 수, 선택률)는 oracles/bet_options 에 이미 반영돼 있고,
-- 티커에 필요한 최소 정보는 recent_activity 뷰가 따로 제공한다.
-- ────────────────────────────────────────
create policy "내 배팅만 볼 수 있다"
  on public.bets for select
  using (user_id = auth.uid() or public.is_admin());

-- INSERT/UPDATE 정책 없음 → place_bet() / cancel_bet() 함수로만 가능

-- ────────────────────────────────────────
-- comments
-- ────────────────────────────────────────
create policy "댓글은 누구나 볼 수 있다"
  on public.comments for select
  using (true);

create policy "로그인한 유저는 댓글을 쓸 수 있다"
  on public.comments for insert
  with check (author_id = auth.uid() and not public.is_banned());

create policy "내 댓글만 지울 수 있다"
  on public.comments for delete
  using (author_id = auth.uid() or public.is_admin());

create policy "좋아요는 누구나 볼 수 있다"
  on public.comment_likes for select
  using (true);

create policy "내 좋아요만 누르고 뗄 수 있다"
  on public.comment_likes for insert
  with check (user_id = auth.uid() and not public.is_banned());

create policy "내 좋아요만 취소할 수 있다"
  on public.comment_likes for delete
  using (user_id = auth.uid());

-- ────────────────────────────────────────
-- follows
-- ────────────────────────────────────────
create policy "팔로우 관계는 누구나 볼 수 있다"
  on public.follows for select
  using (true);

create policy "내 팔로우만 추가할 수 있다"
  on public.follows for insert
  with check (follower_id = auth.uid() and not public.is_banned());

create policy "내 팔로우만 해제할 수 있다"
  on public.follows for delete
  using (follower_id = auth.uid());

-- ────────────────────────────────────────
-- notifications
-- ────────────────────────────────────────
create policy "내 알림만 볼 수 있다"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "내 알림만 읽음 처리할 수 있다"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ────────────────────────────────────────
-- grade_settings
-- ────────────────────────────────────────
create policy "등급 기준은 누구나 볼 수 있다"
  on public.grade_settings for select
  using (true);

create policy "등급 기준은 관리자만 바꾼다"
  on public.grade_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- ────────────────────────────────────────
-- 댓글 수 동기화 (앱이 따로 세지 않아도 되게)
-- ────────────────────────────────────────
create function public.sync_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.oracles set comment_count = comment_count + 1 where id = new.oracle_id;
    return new;
  else
    update public.oracles set comment_count = greatest(0, comment_count - 1) where id = old.oracle_id;
    return old;
  end if;
end;
$$;

create trigger comments_count_sync
  after insert or delete on public.comments
  for each row execute function public.sync_comment_count();

create function public.sync_comment_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set likes = likes + 1 where id = new.comment_id;
    return new;
  else
    update public.comments set likes = greatest(0, likes - 1) where id = old.comment_id;
    return old;
  end if;
end;
$$;

create trigger comment_likes_sync
  after insert or delete on public.comment_likes
  for each row execute function public.sync_comment_likes();
