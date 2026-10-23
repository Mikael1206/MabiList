create table public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('messenger', 'instagram', 'telegram')),
  external_id text not null,
  display_name text not null default '',
  status text not null default 'active' check (status in ('active', 'disconnected')),
  created_at timestamptz not null default now(),
  unique (owner_id, platform, external_id)
);

create table public.channel_secrets (
  connection_id uuid primary key references public.channel_connections (id) on delete cascade,
  access_token text not null,
  webhook_secret text,
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid not null references public.channel_connections (id) on delete cascade,
  platform_thread_id text not null,
  customer_name text,
  status text not null default 'pending' check (status in ('idle', 'pending', 'processing', 'draft_ready', 'failed', 'expired')),
  failure_reason text,
  open_order_id uuid references public.orders (id),
  window_start_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, platform_thread_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  platform_message_id text,
  from_customer boolean not null default true,
  text text not null,
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  raw_payload jsonb,
  unique (conversation_id, platform_message_id)
);

create index channel_connections_owner_status_idx on public.channel_connections (owner_id, status, created_at desc);
create index channel_connections_platform_id_idx on public.channel_connections (platform, external_id);
create index conversations_owner_status_idx on public.conversations (owner_id, status, last_message_at desc);
create index conversations_connection_idx on public.conversations (connection_id);
create index chat_messages_owner_expires_idx on public.chat_messages (owner_id, expires_at);
create index chat_messages_conversation_idx on public.chat_messages (conversation_id, sent_at desc);

alter table public.channel_connections enable row level security;
alter table public.channel_secrets enable row level security;
alter table public.conversations enable row level security;
alter table public.chat_messages enable row level security;

revoke all on public.channel_connections, public.channel_secrets, public.conversations, public.chat_messages from public, anon;
grant select, insert, update, delete on public.channel_connections, public.conversations, public.chat_messages to authenticated;
revoke all on public.channel_secrets from authenticated;

drop policy if exists channel_connections_select on public.channel_connections;
drop policy if exists channel_connections_insert on public.channel_connections;
drop policy if exists channel_connections_update on public.channel_connections;
drop policy if exists channel_connections_delete on public.channel_connections;

drop policy if exists conversations_select on public.conversations;
drop policy if exists conversations_insert on public.conversations;
drop policy if exists conversations_update on public.conversations;
drop policy if exists conversations_delete on public.conversations;

drop policy if exists chat_messages_select on public.chat_messages;
drop policy if exists chat_messages_insert on public.chat_messages;
drop policy if exists chat_messages_update on public.chat_messages;
drop policy if exists chat_messages_delete on public.chat_messages;

create policy channel_connections_select on public.channel_connections for select to authenticated
  using (owner_id = (select auth.uid()));
create policy channel_connections_insert on public.channel_connections for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy channel_connections_update on public.channel_connections for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy channel_connections_delete on public.channel_connections for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy conversations_select on public.conversations for select to authenticated
  using (owner_id = (select auth.uid()));
create policy conversations_insert on public.conversations for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy conversations_update on public.conversations for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy conversations_delete on public.conversations for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy chat_messages_select on public.chat_messages for select to authenticated
  using (owner_id = (select auth.uid()));
create policy chat_messages_insert on public.chat_messages for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy chat_messages_update on public.chat_messages for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy chat_messages_delete on public.chat_messages for delete to authenticated
  using (owner_id = (select auth.uid()));

-- `channel_secrets` remains server-only. No authenticated policy exposes it.
create policy channel_secrets_block_select on public.channel_secrets for select to authenticated
  using (false);
create policy channel_secrets_block_insert on public.channel_secrets for insert to authenticated
  with check (false);
create policy channel_secrets_block_update on public.channel_secrets for update to authenticated
  using (false)
  with check (false);
create policy channel_secrets_block_delete on public.channel_secrets for delete to authenticated
  using (false);
