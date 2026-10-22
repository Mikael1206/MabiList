drop index public.orders_upload_idx;
drop index public.orders_matches_idx;
drop index public.order_items_order_idx;

create index orders_upload_owner_idx on public.orders (upload_id, owner_id);
create index orders_matches_owner_idx on public.orders (matches_order_id, owner_id);
create index order_items_order_owner_idx on public.order_items (order_id, owner_id);

-- The composite order FK already guarantees that an item's owner exists.
alter table public.order_items drop constraint order_items_owner_id_fkey;
