-- Lumi Blaster — accounts, cloud saves, ranked endless runs and leaderboards.
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

create extension if not exists citext;

-- ---------------------------------------------------------------- tables
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,   -- permanent account id
  username    citext not null,
  avatar      text not null default 'lumi',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_username_format check (username::text ~ '^[A-Za-z0-9_]{3,20}$'),
  constraint profiles_avatar_known check (avatar in ('lumi','nova','riko','pip','aria','kestrel','mochi','sable','juno','vega',
                                                    'haru','ines','dax','orla','zephyr','tamsin','wren','cass','elio','luma'))
);
-- citext makes this unique index case-insensitive: "Lumi" and "lumi" cannot both exist.
create unique index if not exists profiles_username_key on public.profiles (username);

create table if not exists public.saves (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint saves_is_object check (jsonb_typeof(data) = 'object'),
  constraint saves_size check (pg_column_size(data) < 262144)
);

create table if not exists public.runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  mode           text not null default 'endless' check (mode = 'endless'),
  seed           bigint not null,
  rules_version  int not null,
  avatar         text not null default 'lumi',
  status         text not null default 'open' check (status in ('open', 'valid', 'rejected', 'abandoned')),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  score          int,
  survival_ms    int,
  kills          int,
  reject_reason  text
);
create index if not exists runs_valid_finished_idx on public.runs (finished_at) where status = 'valid';
create index if not exists runs_user_idx on public.runs (user_id, started_at desc);

-- ---------------------------------------------------------------- updated_at
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- privileges + row level security
alter table public.profiles enable row level security;
alter table public.saves    enable row level security;
alter table public.runs     enable row level security;

revoke all on public.profiles, public.saves, public.runs from anon, authenticated;

-- profiles: anyone signed in may read usernames/avatars (no private data lives here);
-- a player may change only their own avatar column. Usernames change only through claim_username().
grant select on public.profiles to authenticated;
grant update (avatar) on public.profiles to authenticated;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- saves: each player reads and writes only their own row; no deletes from the client.
grant select, insert, update on public.saves to authenticated;
drop policy if exists saves_select_own on public.saves;
create policy saves_select_own on public.saves for select to authenticated using (user_id = auth.uid());
drop policy if exists saves_insert_own on public.saves;
create policy saves_insert_own on public.saves for insert to authenticated with check (user_id = auth.uid());
drop policy if exists saves_update_own on public.saves;
create policy saves_update_own on public.saves for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- runs: players can read their own history. Only the server (service role) creates or finishes runs,
-- so leaderboard records cannot be edited from the browser.
grant select on public.runs to authenticated;
drop policy if exists runs_select_own on public.runs;
create policy runs_select_own on public.runs for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- usernames
create or replace function public.username_available(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_name ~ '^[A-Za-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles
                     where username = p_name::citext
                       and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid));
$$;

-- Creates the profile on first call, renames it on later calls. Requires a verified email or phone.
create or replace function public.claim_username(p_name text) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  verified boolean;
  result public.profiles;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN' using errcode = '28000'; end if;
  if p_name is null or p_name !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'USERNAME_INVALID' using errcode = '22023'; end if;
  select (u.email_confirmed_at is not null or u.phone_confirmed_at is not null) into verified from auth.users u where u.id = uid;
  if not coalesce(verified, false) then raise exception 'NOT_VERIFIED' using errcode = '42501'; end if;
  begin
    insert into public.profiles (id, username) values (uid, p_name)
    on conflict (id) do update set username = excluded.username
    returning * into result;
  exception when unique_violation then
    raise exception 'USERNAME_TAKEN' using errcode = '23505';
  end;
  return result;
end $$;

-- ---------------------------------------------------------------- leaderboards (Asia/Manila periods)
-- daily  = Manila midnight to midnight; weekly = Monday 00:00 to next Monday 00:00 (Manila).
create or replace function public.lb_current_key(p_kind text) returns date
language sql stable set search_path = public as $$
  select case when p_kind = 'weekly' then date_trunc('week', now() at time zone 'Asia/Manila')::date
              else (now() at time zone 'Asia/Manila')::date end;
$$;

create or replace function public.lb_bounds(p_kind text, p_key date, out start_ts timestamptz, out end_ts timestamptz)
language plpgsql stable set search_path = public as $$
begin
  if p_kind = 'daily' then
    start_ts := (p_key::timestamp) at time zone 'Asia/Manila';
    end_ts   := ((p_key + 1)::timestamp) at time zone 'Asia/Manila';
  elsif p_kind = 'weekly' then
    start_ts := date_trunc('week', p_key::timestamp) at time zone 'Asia/Manila';
    end_ts   := (date_trunc('week', p_key::timestamp) + interval '7 days') at time zone 'Asia/Manila';
  else
    raise exception 'BAD_PERIOD' using errcode = '22023';
  end if;
end $$;

-- Best valid run per player in the period, counted once. Ties: the player who reached the score first ranks higher.
create or replace function public.lb_ranked(p_kind text, p_key date)
returns table (rank bigint, user_id uuid, score int, survival_ms int, finished_at timestamptz, avatar text)
language sql stable security definer set search_path = public as $$
  with b as (select * from public.lb_bounds(p_kind, coalesce(p_key, public.lb_current_key(p_kind)))),
  best as (
    select distinct on (r.user_id) r.user_id, r.score, r.survival_ms, r.finished_at, r.avatar
    from public.runs r, b
    where r.status = 'valid' and r.finished_at >= b.start_ts and r.finished_at < b.end_ts
    order by r.user_id, r.score desc, r.finished_at asc
  )
  select row_number() over (order by score desc, finished_at asc, user_id), user_id, score, survival_ms, finished_at, avatar from best;
$$;
revoke all on function public.lb_ranked(text, date) from public, anon, authenticated;

create or replace function public.get_leaderboard(p_kind text, p_key date default null, p_limit int default 100)
returns table (rank bigint, username text, avatar text, score int, survival_ms int, finished_at timestamptz, is_me boolean)
language sql stable security definer set search_path = public as $$
  select r.rank, p.username::text, r.avatar, r.score, r.survival_ms, r.finished_at, r.user_id = auth.uid()
  from public.lb_ranked(p_kind, p_key) r join public.profiles p on p.id = r.user_id
  order by r.rank
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
$$;

create or replace function public.get_my_standing(p_kind text, p_key date default null)
returns table (rank bigint, score int, survival_ms int, players bigint)
language sql stable security definer set search_path = public as $$
  with r as (select * from public.lb_ranked(p_kind, p_key))
  select r.rank, r.score, r.survival_ms, (select count(*) from r) from r where r.user_id = auth.uid()
  union all
  select null, null, null, (select count(*) from r) where not exists (select 1 from r where r.user_id = auth.uid())
  limit 1;
$$;

-- Archive index: completed and current periods that have at least one valid run.
create or replace function public.list_periods(p_kind text, p_limit int default 30)
returns table (period date, players bigint)
language sql stable security definer set search_path = public as $$
  select k, count(distinct user_id) from (
    select case when p_kind = 'weekly' then date_trunc('week', finished_at at time zone 'Asia/Manila')::date
                else (finished_at at time zone 'Asia/Manila')::date end as k, user_id
    from public.runs where status = 'valid'
  ) s group by k order by k desc limit least(greatest(coalesce(p_limit, 30), 1), 120);
$$;

create or replace function public.my_endless_best()
returns table (best_score int, best_survival_ms int, valid_runs bigint)
language sql stable security definer set search_path = public as $$
  select max(score), max(survival_ms), count(*) from public.runs where user_id = auth.uid() and status = 'valid';
$$;

revoke all on function public.username_available(text), public.claim_username(text), public.get_leaderboard(text, date, int),
  public.get_my_standing(text, date), public.list_periods(text, int), public.my_endless_best() from public;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.claim_username(text), public.get_leaderboard(text, date, int), public.get_my_standing(text, date),
  public.list_periods(text, int), public.my_endless_best() to authenticated;
grant execute on function public.lb_current_key(text), public.lb_bounds(text, date) to authenticated;
