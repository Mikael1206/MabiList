begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-a@mabilist.invalid', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test-b@mabilist.invalid', '', now(), now(), now());

insert into public.uploads (id, owner_id, kind)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'text');
insert into public.orders (id, owner_id, upload_id, source)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'paste');
insert into public.order_items (order_id, owner_id, name, quantity)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'Sample', 1);
insert into storage.objects (bucket_id, name, owner_id)
values ('mabilist-uploads', '11111111-1111-4111-8111-111111111111/sample.png', '11111111-1111-4111-8111-111111111111');

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

do $$
declare denied boolean := false;
declare changed_count integer;
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Owner B profile isolation failed'; end if;
  if (select count(*) from public.uploads) <> 0 then raise exception 'Owner B upload isolation failed'; end if;
  if (select count(*) from public.orders) <> 0 then raise exception 'Owner B order isolation failed'; end if;
  if (select count(*) from public.order_items) <> 0 then raise exception 'Owner B item isolation failed'; end if;
  if (select count(*) from storage.objects where bucket_id = 'mabilist-uploads') <> 0 then raise exception 'Owner B storage isolation failed'; end if;
  update public.orders set customer_name = 'wrong owner' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then raise exception 'Owner B changed A order'; end if;
  begin
    insert into public.orders (owner_id, source) values ('11111111-1111-4111-8111-111111111111', 'manual');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Owner B inserted for A'; end if;
  denied := false;
  begin
    insert into storage.objects (bucket_id, name, owner_id)
    values ('mabilist-uploads', '11111111-1111-4111-8111-111111111111/forged.png', '22222222-2222-4222-8222-222222222222');
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'Owner B wrote into A folder'; end if;
end $$;

select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'Owner A profile access failed'; end if;
  if (select count(*) from public.uploads) <> 1 then raise exception 'Owner A upload access failed'; end if;
  if (select count(*) from public.orders) <> 1 then raise exception 'Owner A order access failed'; end if;
  if (select count(*) from public.order_items) <> 1 then raise exception 'Owner A item access failed'; end if;
  if (select count(*) from storage.objects where bucket_id = 'mabilist-uploads') <> 1 then raise exception 'Owner A storage access failed'; end if;
end $$;

rollback;
