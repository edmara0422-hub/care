-- ═══════════════════════════════════════════════════════════════
-- CARE — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────
create table if not exists profiles (
  id                    uuid references auth.users primary key,
  user_name             text not null default '',
  user_email            text not null default '',
  has_onboarded         boolean not null default false,
  wellness_goals        text[] not null default '{}',
  check_in_schedule     text[] not null default '{}',
  detection_methods     text[] not null default '{}',
  medication_status     text,
  notifications_enabled boolean not null default false,
  updated_at            timestamptz not null default now()
);

-- ── psych_profiles ────────────────────────────────────────────────
create table if not exists psych_profiles (
  user_id           uuid references auth.users primary key,
  anxiety_score     integer not null default 0,
  depression_score  integer not null default 0,
  tdah_score        integer not null default 0,
  burnout_score     integer not null default 0,
  stress_score      integer not null default 0,
  detected_patterns text[] not null default '{}',
  has_migraine      boolean not null default false,
  medication_status text,
  updated_at        timestamptz not null default now()
);

-- ── check_ins ─────────────────────────────────────────────────────
create table if not exists check_ins (
  id          text primary key,
  user_id     uuid references auth.users not null,
  mood        text not null,
  score       integer not null,
  timestamp   bigint not null,
  note        text,
  triggers    text[] not null default '{}',
  sensor_data jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists check_ins_user_ts on check_ins (user_id, timestamp desc);

-- ── sleep_logs ────────────────────────────────────────────────────
create table if not exists sleep_logs (
  id         text primary key,
  user_id    uuid references auth.users not null,
  date       text not null,
  quality    integer not null,
  hours      numeric not null,
  notes      text,
  timestamp  bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists sleep_logs_user_ts on sleep_logs (user_id, timestamp desc);

-- ── chat_messages ─────────────────────────────────────────────────
create table if not exists chat_messages (
  id         text primary key,
  user_id    uuid references auth.users not null,
  role       text not null,
  content    text not null,
  timestamp  bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_user_ts on chat_messages (user_id, timestamp desc);

-- ── achievements ──────────────────────────────────────────────────
create table if not exists achievements (
  achievement_id text not null,
  user_id        uuid references auth.users not null,
  unlocked_at    bigint not null,
  primary key (achievement_id, user_id)
);

-- ── completed_practices ───────────────────────────────────────────
create table if not exists completed_practices (
  practice_id text not null,
  user_id     uuid references auth.users not null,
  primary key (practice_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security — cada usuário só vê/escreve os próprios dados
-- ═══════════════════════════════════════════════════════════════

alter table profiles           enable row level security;
alter table psych_profiles     enable row level security;
alter table check_ins          enable row level security;
alter table sleep_logs         enable row level security;
alter table chat_messages      enable row level security;
alter table achievements       enable row level security;
alter table completed_practices enable row level security;

-- profiles
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- psych_profiles
create policy "own psych profile" on psych_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- check_ins
create policy "own check_ins" on check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sleep_logs
create policy "own sleep_logs" on sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- chat_messages
create policy "own chat_messages" on chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- achievements
create policy "own achievements" on achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- completed_practices
create policy "own completed_practices" on completed_practices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Auto-create profile row on signup
-- ═══════════════════════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, user_email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
