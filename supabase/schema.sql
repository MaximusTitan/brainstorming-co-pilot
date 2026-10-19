-- Run once in the Supabase SQL editor (safe to re-run).

-- Remove the earlier anonymous-session setup, if present.
drop function if exists public.get_session(uuid);
drop function if exists public.save_session(uuid, jsonb);
drop table if exists public.sessions;

create table if not exists public.boards (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '',
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists boards_user_idx on public.boards (user_id, updated_at desc);

alter table public.boards enable row level security;

drop policy if exists "own boards select" on public.boards;
drop policy if exists "own boards insert" on public.boards;
drop policy if exists "own boards update" on public.boards;
drop policy if exists "own boards delete" on public.boards;
create policy "own boards select" on public.boards for select to authenticated using (user_id = auth.uid());
create policy "own boards insert" on public.boards for insert to authenticated with check (user_id = auth.uid());
create policy "own boards update" on public.boards for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own boards delete" on public.boards for delete to authenticated using (user_id = auth.uid());
