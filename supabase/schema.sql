-- Alphabet Flipper Supabase schema
-- Run once in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  name text not null default 'Little Learner',
  level text not null default 'LKG' check (level in ('LKG','UKG','Class 1')),
  avatar text not null default '🦊',
  role text not null default 'user' check (role in ('admin','user')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  section text not null check (section in ('home','learn','games','worksheets','progress')),
  enabled boolean not null default false,
  primary key (user_id, section)
);

create table if not exists public.user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  level text not null check (level in ('LKG','UKG','Class 1')),
  visited integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, level)
);

alter table public.profiles enable row level security;
alter table public.user_access enable row level security;
alter table public.user_progress enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.user_access from anon, authenticated;
revoke all on public.user_progress from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.user_access to authenticated;
grant select, insert, update on public.user_progress to authenticated;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "access_self_select" on public.user_access;
create policy "access_self_select" on public.user_access
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "access_self_write" on public.user_access;
create policy "access_self_write" on public.user_access
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress_self_select" on public.user_progress;
create policy "progress_self_select" on public.user_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "progress_self_write" on public.user_progress;
create policy "progress_self_write" on public.user_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists user_access_user_id_idx on public.user_access(user_id);
create index if not exists user_progress_user_id_idx on public.user_progress(user_id);

-- After creating the first admin Auth user, insert its UUID below:
-- insert into public.profiles(id, username, name, level, avatar, role, active)
-- values ('AUTH_USER_UUID', 'your-admin-username', 'Administrator', 'Class 1', '🦁', 'admin', true);
-- insert into public.user_access(user_id, section, enabled)
-- select 'AUTH_USER_UUID', section, true
-- from unnest(array['home','learn','games','worksheets','progress']) as section
-- on conflict (user_id, section) do update set enabled = excluded.enabled;

-- Users may edit only their own learner-facing profile fields.
-- They cannot change role or active state from the browser.
create or replace function public.update_my_profile(
  p_name text,
  p_level text,
  p_avatar text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set name = left(coalesce(p_name, 'Little Learner'), 30),
      level = case when p_level in ('LKG','UKG','Class 1') then p_level else level end,
      avatar = case when p_avatar in ('🦊','🐼','🐯','🐰','🐸','🦁') then p_avatar else avatar end
  where id = (select auth.uid());
$$;

revoke all on function public.update_my_profile(text, text, text) from public;
grant execute on function public.update_my_profile(text, text, text) to authenticated;
