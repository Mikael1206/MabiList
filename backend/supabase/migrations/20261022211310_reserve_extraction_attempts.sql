create table if not exists public.extraction_attempts (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists extraction_attempts_owner_created_idx on public.extraction_attempts (owner_id, created_at);
alter table public.extraction_attempts enable row level security;
revoke all on public.extraction_attempts from public, anon;
grant select, insert on public.extraction_attempts to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'extraction_attempts' and policyname = 'extraction_attempts_select') then
    create policy extraction_attempts_select on public.extraction_attempts for select to authenticated
      using (owner_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'extraction_attempts' and policyname = 'extraction_attempts_insert') then
    create policy extraction_attempts_insert on public.extraction_attempts for insert to authenticated
      with check (owner_id = (select auth.uid()));
  end if;
end;
$$;

create or replace function public.reserve_extraction_attempt(p_limit integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  day_start timestamptz := date_trunc('day', now() at time zone 'Asia/Manila') at time zone 'Asia/Manila';
begin
  if auth.uid() is null or p_limit < 1 then return false; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if (select count(*) from public.extraction_attempts
      where owner_id = auth.uid() and created_at >= day_start) >= p_limit then
    return false;
  end if;
  insert into public.extraction_attempts (owner_id) values (auth.uid());
  return true;
end;
$$;

revoke all on function public.reserve_extraction_attempt(integer) from public, anon;
grant execute on function public.reserve_extraction_attempt(integer) to authenticated;
