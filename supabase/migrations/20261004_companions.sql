-- Persistent personal following; apply after schema.sql and the language migration.
begin;
create table if not exists private.follows (
 owner_id uuid not null references private.profiles(id) on delete cascade,
 member_id uuid not null references private.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(owner_id,member_id), check(owner_id<>member_id)
);
alter table private.follows enable row level security;
revoke all on private.follows from public,anon,authenticated;

create or replace function public.set_follow(p_username text,p_follow boolean) returns void
language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member(); target uuid;
begin
 if p_follow is null then raise exception 'اختار إجراء المتابعة.';end if;
 select id into target from private.profiles where username=lower(trim(leading '@' from trim(p_username)));
 if target is null or target=u then raise exception 'اختار اسم مستخدم لعضو آخر.';end if;
 if p_follow then
  if not exists(select 1 from private.profiles where id=target and status='approved') then raise exception 'العضو غير متاح.';end if;
  insert into private.follows(owner_id,member_id) values(u,target) on conflict do nothing;
 else delete from private.follows where owner_id=u and member_id=target;
 end if;
end $$;

create or replace function public.followed_members() returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member(); day_start timestamptz:=(now() at time zone 'Africa/Cairo')::date::timestamp at time zone 'Africa/Cairo';
begin
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.username) from (
  select p.id,p.username,p.display_name,
   (select count(*) from private.progress g where g.user_id=p.id) total,
   (select count(*) from private.progress g where g.user_id=p.id and g.completed_at>=day_start and g.completed_at<(((now() at time zone 'Africa/Cairo')::date+1)::timestamp at time zone 'Africa/Cairo')) today_read
  from private.follows f join private.profiles p on p.id=f.member_id
  where f.owner_id=u and p.status='approved'
 )x),'[]'::jsonb);
end $$;

create or replace function public.organization_members(p_org uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member(); is_admin boolean; day_start timestamptz:=(now() at time zone 'Africa/Cairo')::date::timestamp at time zone 'Africa/Cairo';
begin
 select role='admin' into is_admin from private.profiles where id=u;
 if not is_admin and not exists(select 1 from private.memberships where organization_id=p_org and user_id=u) then
  raise exception 'المجموعة متاحة لأعضائها فقط.' using errcode='42501';
 end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.username) from (
  select p.id,p.username,p.display_name,
   (select count(*) from private.progress g where g.user_id=p.id) total,
   (select count(*) from private.progress g where g.user_id=p.id and g.completed_at>=day_start and g.completed_at<(((now() at time zone 'Africa/Cairo')::date+1)::timestamp at time zone 'Africa/Cairo')) today_read,
   case when is_admin then (select to_jsonb(pl) from private.plans pl where pl.user_id=p.id) else null end plan
  from private.profiles p join private.memberships m on m.user_id=p.id
  where m.organization_id=p_org and p.status='approved'
 )x),'[]'::jsonb);
end $$;
revoke all on function public.set_follow(text,boolean),public.followed_members(),public.organization_members(uuid) from public,anon,authenticated;
grant execute on function public.set_follow(text,boolean),public.followed_members(),public.organization_members(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
