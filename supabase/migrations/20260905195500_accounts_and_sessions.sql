create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'candidate'
    check (role in ('candidate', 'admin', 'super-admin')),
  organization text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

create policy "users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'candidate');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null,
  role text not null
    check (role in ('software-engineer', 'product-manager', 'data-scientist')),
  candidate_name text not null,
  overall integer not null check (overall between 0 and 100),
  dimensions jsonb not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  answer_count integer not null check (answer_count > 0),
  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_user_completed_idx
  on public.interview_sessions (user_id, completed_at desc);

alter table public.interview_sessions enable row level security;
revoke all on public.interview_sessions from anon;
grant select, insert, update, delete on public.interview_sessions to authenticated;

create policy "users can read their own sessions"
  on public.interview_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can insert their own sessions"
  on public.interview_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can update their own sessions"
  on public.interview_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "users can delete their own sessions"
  on public.interview_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
