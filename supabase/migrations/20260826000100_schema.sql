-- Oracle Page — 기본 스키마
--
-- 설계 원칙: 포인트가 걸린 값(points, streak, bet.status, payout)은
-- 클라이언트가 직접 쓸 수 없다. RLS 로 쓰기를 막고, 오직
-- 20260826000300_functions.sql 의 SECURITY DEFINER 함수로만 바뀐다.

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────
-- profiles : auth.users 확장
-- ────────────────────────────────────────
create table public.profiles (
  id                  uuid primary key references auth.users on delete cascade,
  name                text        not null check (char_length(name) between 1 and 20),
  avatar              text        not null default '🌟',
  role                text        not null default 'user' check (role in ('user', 'admin')),

  -- 아래 5개는 서버 함수만 수정한다 (RLS 참고)
  points              integer     not null default 1500 check (points >= 0),
  accuracy            smallint    not null default 0 check (accuracy between 0 and 100),
  total_bets          integer     not null default 0 check (total_bets >= 0),
  won_bets            integer     not null default 0 check (won_bets >= 0),
  current_streak      integer     not null default 0 check (current_streak >= 0),
  best_streak         integer     not null default 0 check (best_streak >= 0),

  grade_id            text        not null default 'bulbasaur',
  grade_override      boolean     not null default false,
  last_daily_bonus_at timestamptz,

  is_banned           boolean     not null default false,
  ban_reason          text,

  joined_at           timestamptz not null default now(),
  last_active         timestamptz not null default now()
);

create index profiles_points_idx on public.profiles (points desc) where not is_banned;

-- ────────────────────────────────────────
-- oracles
-- ────────────────────────────────────────
create table public.oracles (
  id                 uuid primary key default gen_random_uuid(),
  title              text        not null check (char_length(title) between 1 and 80),
  description        text        not null default '',
  category           text        not null,
  status             text        not null default 'live'
                       check (status in ('live', 'upcoming', 'closed')),

  total_participants integer     not null default 0 check (total_participants >= 0),
  total_pool         bigint      not null default 0 check (total_pool >= 0),

  ends_at            timestamptz not null,
  created_at         timestamptz not null default now(),

  is_hot             boolean     not null default false,
  is_trending        boolean     not null default false,
  is_new             boolean     not null default true,
  tags               text[]      not null default '{}',
  comment_count      integer     not null default 0 check (comment_count >= 0),

  creator_id         uuid        references public.profiles (id) on delete set null,
  creator_name       text        not null,
  creator_avatar     text        not null default '🔮',

  -- 정산 결과. settle_oracle() 만 채운다.
  winning_option_id  uuid,
  settled_at         timestamptz
);

-- 마감 자동 정산이 매분 훑는 조건이라 인덱스를 둔다.
create index oracles_due_idx on public.oracles (ends_at) where status <> 'closed';
create index oracles_created_idx on public.oracles (created_at desc);

-- ────────────────────────────────────────
-- bet_options
-- ────────────────────────────────────────
create table public.bet_options (
  id         uuid primary key default gen_random_uuid(),
  oracle_id  uuid     not null references public.oracles on delete cascade,
  label      text     not null check (char_length(label) between 1 and 40),
  position   smallint not null check (position between 0 and 3),

  -- place_bet() / cancel_bet() 만 수정한다
  total_bets integer  not null default 0 check (total_bets >= 0),
  percentage smallint not null default 0 check (percentage between 0 and 100),
  odds       numeric(6, 2) not null default 1.80 check (odds >= 1),

  unique (oracle_id, position)
);

create index bet_options_oracle_idx on public.bet_options (oracle_id);

alter table public.oracles
  add constraint oracles_winning_option_fk
  foreign key (winning_option_id) references public.bet_options (id) on delete set null;

-- ────────────────────────────────────────
-- bets
-- ────────────────────────────────────────
create table public.bets (
  id           uuid     primary key default gen_random_uuid(),
  user_id      uuid     not null references public.profiles on delete cascade,
  oracle_id    uuid     not null references public.oracles on delete cascade,
  option_id    uuid     not null references public.bet_options on delete cascade,

  amount       integer  not null check (amount > 0),
  -- 배당과 보너스는 배팅 시점 값으로 고정된다. 이후 시장이 움직여도 정산은 이 값으로.
  odds         numeric(6, 2) not null check (odds >= 1),
  grade_bonus  numeric(4, 3) not null default 0 check (grade_bonus >= 0),
  streak_bonus numeric(4, 3) not null default 0 check (streak_bonus >= 0),

  status       text     not null default 'pending'
                 check (status in ('pending', 'won', 'lost')),
  payout       integer  check (payout >= 0),

  placed_at    timestamptz not null default now(),
  settled_at   timestamptz,

  -- 한 예언에 한 번만 참여할 수 있다 (앱 규칙을 DB 에서 강제)
  unique (user_id, oracle_id)
);

create index bets_user_idx   on public.bets (user_id, placed_at desc);
create index bets_oracle_idx on public.bets (oracle_id);
create index bets_recent_idx on public.bets (placed_at desc);

-- ────────────────────────────────────────
-- comments
-- ────────────────────────────────────────
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  oracle_id  uuid not null references public.oracles on delete cascade,
  author_id  uuid not null references public.profiles on delete cascade,
  text       text not null check (char_length(text) between 1 and 500),
  likes      integer not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

create index comments_oracle_idx on public.comments (oracle_id, created_at desc);

-- 좋아요는 누가 눌렀는지 알아야 토글이 되므로 별도 테이블
create table public.comment_likes (
  comment_id uuid not null references public.comments on delete cascade,
  user_id    uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- ────────────────────────────────────────
-- follows
-- ────────────────────────────────────────
create table public.follows (
  follower_id uuid not null references public.profiles on delete cascade,
  followee_id uuid not null references public.profiles on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

-- ────────────────────────────────────────
-- notifications
-- ────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles on delete cascade,
  type       text not null
               check (type in ('bet_result', 'grade_up', 'deadline', 'comment', 'system')),
  title      text not null,
  body       text not null default '',
  oracle_id  uuid references public.oracles on delete cascade,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ────────────────────────────────────────
-- grade_settings : 관리자가 등급 임계값을 바꾼다 (행 하나짜리 설정)
-- ────────────────────────────────────────
create table public.grade_settings (
  id         boolean primary key default true check (id),
  thresholds jsonb   not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.grade_settings (thresholds) values ('{
  "magikarp": 0,
  "bulbasaur": 1000,
  "pikachu": 5000,
  "growlithe": 15000,
  "mew": 30000,
  "mewtwo": 60000,
  "arceus": 100000
}'::jsonb);

-- ────────────────────────────────────────
-- 활동 티커 : 별도 테이블 없이 최근 배팅에서 뽑는다
-- ────────────────────────────────────────
create view public.recent_activity
with (security_invoker = true) as
select
  b.id,
  b.user_id,
  p.name   as user_name,
  p.avatar,
  p.grade_id,
  b.oracle_id,
  o.title  as oracle_title,
  opt.label as option_label,
  b.amount,
  b.placed_at as created_at
from public.bets b
join public.profiles    p   on p.id   = b.user_id
join public.oracles     o   on o.id   = b.oracle_id
join public.bet_options opt on opt.id = b.option_id
order by b.placed_at desc
limit 50;

-- ────────────────────────────────────────
-- 가입 시 프로필 자동 생성
-- ────────────────────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), '예언가' || left(new.id::text, 4)),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar', ''), '🌟')
  );

  insert into public.notifications (user_id, type, title, body)
  values (
    new.id,
    'system',
    'Oracle Page에 오신걸 환영합니다! 🔮',
    '연습 예언에 참여하면 곧 결과를 볼 수 있어요.'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
