-- =============================================================================
-- Forge — Supabase schema (Phase 6.3)
-- =============================================================================
-- Run this once in the Supabase Dashboard: SQL Editor > New Query > paste > Run.
--
-- This is schema + RLS setup ONLY. As of Phase 6.3, nothing in the app calls
-- these tables yet — the builder and My Apps still read/write localStorage
-- exclusively (see src/lib/storage.ts). Connecting real persistence is a
-- later step.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- One row per auth user, created automatically by the trigger at the bottom of
-- this file the moment a new account exists. Holds the small amount of
-- identity data Forge needs beyond what auth.users already has (email).

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_index integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT policy: normally profile rows are created by handle_new_user() below
-- (SECURITY DEFINER, bypasses RLS) at signup. This policy exists only as a
-- backfill path for accounts created before that trigger existed — saveProfile()
-- upserts, so a user with a missing row can still create their own (and only
-- their own) profile row instead of every save silently no-op'ing.
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- apps
-- -----------------------------------------------------------------------------
-- Mirrors the local `App` shape in src/lib/types.ts. `widgets` stays a single
-- jsonb blob rather than a normalized widgets table — Forge widgets are only
-- ever read/written as one full array per app, never queried individually, so
-- normalizing would add joins with no real benefit.

create table if not exists public.apps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null default 'Untitled App',
  description  text not null default '',
  status       text not null default 'draft' check (status in ('draft', 'published')),
  thumbnail    text not null default '',
  widgets      jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists apps_user_id_idx on public.apps (user_id);
create index if not exists apps_status_idx  on public.apps (status);

alter table public.apps enable row level security;

drop policy if exists "Users can select their own apps" on public.apps;
create policy "Users can select their own apps"
  on public.apps for select
  using (auth.uid() = user_id);

-- Published apps are visible to anyone, including logged-out (anon) visitors —
-- this is what will eventually let /app/[appId] resolve for someone who isn't
-- the app's owner. Combined with the policy above via OR (Postgres unions
-- multiple permissive policies for the same command), the effective rule is:
-- "you can see a row if you own it, or if it's published." Drafts stay
-- invisible to everyone except their owner.
drop policy if exists "Published apps are publicly selectable" on public.apps;
create policy "Published apps are publicly selectable"
  on public.apps for select
  using (status = 'published');

drop policy if exists "Users can insert their own apps" on public.apps;
create policy "Users can insert their own apps"
  on public.apps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own apps" on public.apps;
create policy "Users can update their own apps"
  on public.apps for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own apps" on public.apps;
create policy "Users can delete their own apps"
  on public.apps for delete
  using (auth.uid() = user_id);

-- Note: unlike src/lib/storage.ts's saveApp(), this schema does not include a
-- trigger to revert status to 'draft' on update. That rule lives at the
-- application layer locally; whichever code eventually writes to this table
-- (a later phase) needs to either replicate it in a Postgres trigger or keep
-- enforcing it in application code, the same way storage.ts does today.


-- -----------------------------------------------------------------------------
-- New-user trigger: auto-create a profile row
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so this can insert into public.profiles on behalf of a
-- brand-new user who has no rows — and therefore no RLS grant — yet.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_index)
  values (new.id, null, 0);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
