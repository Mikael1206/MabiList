-- Extraction can leave quantity unknown; never turn absence into one.
alter table public.order_items alter column quantity drop not null;
