-- Nova Vanguard: nickname play. Guests sign in anonymously (Supabase "anonymous sign-ins") and may claim a nickname
-- without verifying an email or phone. Nicknames use the same rules and uniqueness as usernames.
create or replace function public.claim_username(p_name text) returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  allowed boolean;
  result public.profiles;
begin
  if uid is null then raise exception 'NOT_SIGNED_IN' using errcode = '28000'; end if;
  if p_name is null or p_name !~ '^[A-Za-z0-9_]{3,20}$' then raise exception 'USERNAME_INVALID' using errcode = '22023'; end if;
  select (u.email_confirmed_at is not null or u.phone_confirmed_at is not null or coalesce(u.is_anonymous, false))
    into allowed from auth.users u where u.id = uid;
  if not coalesce(allowed, false) then raise exception 'NOT_VERIFIED' using errcode = '42501'; end if;
  begin
    insert into public.profiles (id, username) values (uid, p_name)
    on conflict (id) do update set username = excluded.username
    returning * into result;
  exception when unique_violation then
    raise exception 'USERNAME_TAKEN' using errcode = '23505';
  end;
  return result;
end $$;
revoke all on function public.claim_username(text) from public;
grant execute on function public.claim_username(text) to authenticated;
