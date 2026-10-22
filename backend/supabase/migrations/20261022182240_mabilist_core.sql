create table public.profiles (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  shop_name text not null default ''
);

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('image', 'text')),
  image_paths text[] not null default '{}',
  raw_text text,
  status text not null default 'processing' check (status in ('processing', 'draft_ready', 'no_order', 'failed', 'consumed', 'expired')),
  failure_reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  raw_deleted_at timestamptz,
  unique (id, owner_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  upload_id uuid,
  conversation_id uuid,
  source text not null check (source in ('screenshot', 'paste', 'manual', 'messenger', 'instagram', 'telegram')),
  state text not null default 'draft' check (state in ('draft', 'confirmed')),
  customer_name text,
  total_php numeric(12, 2) check (total_php >= 0),
  delivery_date date,
  payment_status text not null default 'not_stated' check (payment_status in ('unpaid', 'paid', 'not_stated')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'delivered')),
  not_in_chat text[] not null default '{}',
  matches_order_id uuid,
  is_sample boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  foreign key (upload_id, owner_id) references public.uploads (id, owner_id),
  foreign key (matches_order_id, owner_id) references public.orders (id, owner_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  quantity integer not null check (quantity > 0),
  unit_price_php numeric(12, 2) check (unit_price_php >= 0),
  foreign key (order_id, owner_id) references public.orders (id, owner_id) on delete cascade
);

create index uploads_owner_status_idx on public.uploads (owner_id, status);
create index orders_owner_state_date_idx on public.orders (owner_id, state, delivery_date);
create index orders_upload_idx on public.orders (upload_id) where upload_id is not null;
create index orders_matches_idx on public.orders (matches_order_id) where matches_order_id is not null;
create index order_items_order_idx on public.order_items (order_id);

alter table public.profiles enable row level security;
alter table public.uploads enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on public.profiles, public.uploads, public.orders, public.order_items from public, anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.uploads, public.orders, public.order_items to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (owner_id = (select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy uploads_select on public.uploads for select to authenticated
  using (owner_id = (select auth.uid()));
create policy uploads_insert on public.uploads for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy uploads_update on public.uploads for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy uploads_delete on public.uploads for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy orders_select on public.orders for select to authenticated
  using (owner_id = (select auth.uid()));
create policy orders_insert on public.orders for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy orders_update on public.orders for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy orders_delete on public.orders for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy order_items_select on public.order_items for select to authenticated
  using (owner_id = (select auth.uid()));
create policy order_items_insert on public.order_items for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy order_items_update on public.order_items for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy order_items_delete on public.order_items for delete to authenticated
  using (owner_id = (select auth.uid()));

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.create_owner_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (owner_id) values (new.id);
  return new;
end;
$$;

revoke all on function private.create_owner_profile() from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.create_owner_profile() to supabase_auth_admin;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.create_owner_profile();

insert into storage.buckets (id, name, public)
values ('mabilist-uploads', 'mabilist-uploads', false)
on conflict (id) do update set public = false;

create policy mabilist_uploads_select on storage.objects for select to authenticated
  using (
    bucket_id = 'mabilist-uploads'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );
create policy mabilist_uploads_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mabilist-uploads'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );
create policy mabilist_uploads_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'mabilist-uploads'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and owner_id = (select auth.uid()::text)
  );
