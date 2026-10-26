begin;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cap-a@mabilist.invalid', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cap-b@mabilist.invalid', '', now(), now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
begin
  if not public.reserve_extraction_attempt(1) then raise exception 'First attempt was refused'; end if;
  if public.reserve_extraction_attempt(1) then raise exception 'Cap did not stop second attempt'; end if;
  if (select count(*) from public.extraction_attempts) <> 1 then raise exception 'Attempt count wrong'; end if;
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

do $$
begin
  if (select count(*) from public.extraction_attempts) <> 0 then raise exception 'Owner B read A attempts'; end if;
  if not public.reserve_extraction_attempt(1) then raise exception 'Owner B cap was shared with A'; end if;
end $$;

rollback;
