-- Run once in the Supabase SQL editor (safe to re-run).
create table if not exists public.sessions (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- No policies: the table can't be read or listed directly with the publishable key.
alter table public.sessions enable row level security;

-- Access only via these functions, which need the session's (unguessable) UUID.
create or replace function public.get_session(p_id uuid)
returns jsonb language sql security definer set search_path = public as $$
  select data from public.sessions where id = p_id;
$$;

create or replace function public.save_session(p_id uuid, p_data jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.sessions (id, data, updated_at) values (p_id, p_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
$$;

revoke all on function public.get_session(uuid), public.save_session(uuid, jsonb) from public;
grant execute on function public.get_session(uuid), public.save_session(uuid, jsonb) to anon, authenticated;
