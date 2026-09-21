-- Run once in the Supabase SQL editor. No service secrets belong in the website.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[a-z0-9_.]{3,24}$'),
 display_name text not null check(length(trim(display_name)) between 1 and 60),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 role text not null default 'member' check(role in ('member','admin')),
 created_at timestamptz not null default now()
);
create table private.plans (
 user_id uuid primary key references private.profiles(id) on delete cascade,
 start_date date not null, end_date date not null,
 mode text not null check(mode in ('varied','ordered')),
 check(end_date >= start_date and end_date-start_date < 3653)
);
create table private.progress (
 user_id uuid not null references private.profiles(id) on delete cascade,
 chapter_id text not null, completed_at timestamptz not null default now(),
 primary key(user_id,chapter_id)
);
create table private.preferences (
 user_id uuid primary key references private.profiles(id) on delete cascade,
 daily_email boolean not null default false, reminder_email boolean not null default false
);
create table private.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 80),
 description text not null default '' check(length(description)<=250), created_by uuid references private.profiles(id), created_at timestamptz not null default now()
);
create table private.memberships (
 organization_id uuid references private.organizations(id) on delete cascade,
 user_id uuid references private.profiles(id) on delete cascade, primary key(organization_id,user_id)
);
create table private.comments (
 id uuid primary key default gen_random_uuid(), author uuid not null references private.profiles(id) on delete cascade,
 recipient uuid not null references private.profiles(id) on delete cascade,
 body text not null check(length(trim(body)) between 1 and 500), created_at timestamptz not null default now()
);
create index comments_recipient_created on private.comments(recipient,created_at desc);
create index memberships_user on private.memberships(user_id);
create table private.email_log (
 user_id uuid references private.profiles(id) on delete cascade,
 send_date date not null, provider_id text not null, sent_at timestamptz not null default now(), primary key(user_id,send_date)
);
-- Defense in depth: private data has no direct REST/table grants or user policies.
alter table private.profiles enable row level security;
alter table private.plans enable row level security;
alter table private.progress enable row level security;
alter table private.preferences enable row level security;
alter table private.organizations enable row level security;
alter table private.memberships enable row level security;
alter table private.comments enable row level security;
alter table private.email_log enable row level security;
revoke all on all tables in schema private from public, anon, authenticated;

create function private.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into private.profiles(id,username,display_name)
 values(new.id,lower(trim(new.raw_user_meta_data->>'username')),trim(new.raw_user_meta_data->>'display_name'));
 insert into private.preferences(user_id) values(new.id);
 return new;
end $$;
create trigger kalima_signup after insert on auth.users for each row execute function private.on_signup();

create function private.require_member() returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from private.profiles where id=auth.uid() and status='approved') then
 raise exception 'حسابك يحتاج موافقة الأدمن أولًا.' using errcode='42501'; end if;
 return auth.uid();
end $$;
create function private.require_admin() returns uuid language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from private.profiles where id=auth.uid() and status='approved' and role='admin') then
 raise exception 'الإجراء ده متاح للأدمن فقط.' using errcode='42501'; end if;
 return auth.uid();
end $$;

create function public.dashboard() returns jsonb language plpgsql security definer set search_path='' as $$
declare m private.profiles; result jsonb;
begin
 select * into m from private.profiles where id=auth.uid();
 if m.id is null then raise exception 'سجّل الدخول الأول.' using errcode='42501'; end if;
 result:=jsonb_build_object('me',to_jsonb(m));
 if m.status<>'approved' then return result; end if;
 return result || jsonb_build_object(
 'plan',(select to_jsonb(p) from private.plans p where user_id=m.id),
 'done',coalesce((select jsonb_agg(chapter_id order by chapter_id) from private.progress where user_id=m.id),'[]'::jsonb),
 'settings',(select to_jsonb(s) from private.preferences s where user_id=m.id),
 'orgs',coalesce((select jsonb_agg(to_jsonb(o) order by o.name) from private.organizations o where m.role='admin' or exists(select 1 from private.memberships x where x.organization_id=o.id and x.user_id=m.id)),'[]'::jsonb),
 'comments',coalesce((select jsonb_agg(to_jsonb(c)) from (select c.id,c.body,c.created_at,a.display_name author_name from private.comments c join private.profiles a on a.id=c.author where c.recipient=m.id and a.status='approved' order by c.created_at desc limit 20)c),'[]'::jsonb));
end $$;

create function public.save_plan(p_start date,p_end date,p_mode text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member();
begin
 if p_start is null or p_end is null or p_end<p_start or p_end-p_start>=3653 or p_mode is null or p_mode not in ('varied','ordered') then raise exception 'مدة الخطة أو طريقة القراءة غير صحيحة.'; end if;
 insert into private.plans(user_id,start_date,end_date,mode) values(u,p_start,p_end,p_mode) on conflict(user_id) do update set start_date=excluded.start_date,end_date=excluded.end_date,mode=excluded.mode;
end $$;

create function public.set_progress(p_chapters text[],p_done boolean) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member(); c text; b int; ch int;
 sizes int[]:=array[50,40,27,36,34,24,21,4,31,24,22,25,29,36,10,13,10,42,150,31,12,8,66,52,5,48,12,14,3,9,1,4,7,3,3,3,2,14,4,28,16,24,21,28,16,16,13,6,6,4,4,5,3,6,4,3,1,13,5,5,3,5,1,1,1,22];
begin
 if p_done is null or coalesce(array_length(p_chapters,1),0) not between 1 and 1189 then raise exception 'الإصحاحات غير صحيحة.'; end if;
 if not exists(select 1 from private.plans where user_id=u) then raise exception 'أنشئ خطة الأول.'; end if;
 foreach c in array p_chapters loop
 if c is null or c !~ '^[1-9][0-9]?:[1-9][0-9]{0,2}$' then raise exception 'إصحاح غير صحيح.'; end if;
 b:=split_part(c,':',1)::int; ch:=split_part(c,':',2)::int;
 if b not between 1 and 66 or ch>sizes[b] then raise exception 'إصحاح غير موجود.'; end if;
 end loop;
 if p_done then insert into private.progress(user_id,chapter_id) select u,x from unnest(p_chapters)x on conflict do nothing;
 else delete from private.progress where user_id=u and chapter_id=any(p_chapters); end if;
end $$;

create function public.save_preferences(p_daily boolean,p_reminder boolean) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member();
begin insert into private.preferences(user_id,daily_email,reminder_email) values(u,p_daily,p_reminder) on conflict(user_id) do update set daily_email=excluded.daily_email,reminder_email=excluded.reminder_email; end $$;

create function public.search_members(p_query text) returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.require_member();
 if p_query is null or length(trim(p_query))<2 then raise exception 'اكتب حرفين على الأقل.';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from (select p.id,p.username,p.display_name,(select count(*) from private.progress g where g.user_id=p.id) total from private.profiles p where p.status='approved' and strpos(p.username,lower(trim(p_query)))>0 order by p.username limit 30)x),'[]'::jsonb);
end $$;

create function public.member_profile(p_username text) returns jsonb language plpgsql security definer set search_path='' as $$
declare m private.profiles;
begin perform private.require_member();select * into m from private.profiles where username=lower(p_username) and status='approved';if m.id is null then return null;end if;
return jsonb_build_object('member',jsonb_build_object('id',m.id,'username',m.username,'display_name',m.display_name),
 'plan',(select to_jsonb(p) from private.plans p where user_id=m.id),
 'done',coalesce((select jsonb_agg(chapter_id) from private.progress where user_id=m.id),'[]'::jsonb),
 'comments',coalesce((select jsonb_agg(to_jsonb(c)) from (select c.id,c.body,c.created_at,a.display_name author_name from private.comments c join private.profiles a on a.id=c.author where c.recipient=m.id and a.status='approved' order by c.created_at desc limit 50)c),'[]'::jsonb));
end $$;

create function public.send_encouragement(p_recipient uuid,p_body text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member();
begin
 if not exists(select 1 from private.profiles where id=p_recipient and status='approved') then raise exception 'العضو غير متاح.'; end if;
 if p_body is null or length(trim(p_body)) not between 1 and 500 then raise exception 'اكتب تعليق من حرف إلى ٥٠٠ حرف.'; end if;
 perform pg_advisory_xact_lock(hashtext(u::text));
 if (select count(*) from private.comments where author=u and created_at>now()-interval '1 hour')>=20 then raise exception 'استنى شوية قبل إرسال تشجيعات جديدة.'; end if;
 insert into private.comments(author,recipient,body) values(u,p_recipient,trim(p_body));
end $$;

create function public.admin_overview() returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.require_admin();return jsonb_build_object('members',coalesce((select jsonb_agg(to_jsonb(p) order by p.created_at desc) from private.profiles p),'[]'::jsonb),'orgs',coalesce((select jsonb_agg(to_jsonb(o) order by o.name) from private.organizations o),'[]'::jsonb));end $$;
create function public.manage_member(p_user uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_admin();
begin
 if p_user=u then raise exception 'مينفعش تعدّل صلاحيات حسابك من هنا.';end if;
 if not exists(select 1 from private.profiles where id=p_user) then raise exception 'العضو غير موجود.';end if;
 if p_action='approve' then update private.profiles set status='approved' where id=p_user;
 elsif p_action='reject' then update private.profiles set status='rejected' where id=p_user;
 elsif p_action='promote' then update private.profiles set role='admin' where id=p_user and status='approved';
 else raise exception 'إجراء غير صحيح.';end if;
end $$;
create function public.create_organization(p_name text,p_description text) returns uuid language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_admin();org uuid;
begin insert into private.organizations(name,description,created_by) values(trim(p_name),coalesce(trim(p_description),''),u) returning id into org;return org;end $$;
create function public.set_membership(p_org uuid,p_user uuid,p_add boolean) returns void language plpgsql security definer set search_path='' as $$
begin perform private.require_admin();
if p_add then
 if not exists(select 1 from private.profiles where id=p_user and status='approved') then raise exception 'اقبل العضو الأول.';end if;
 insert into private.memberships(organization_id,user_id) values(p_org,p_user) on conflict do nothing;
else delete from private.memberships where organization_id=p_org and user_id=p_user;end if;
end $$;
create function public.organization_members(p_org uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member();
begin
 if not exists(select 1 from private.profiles where id=u and role='admin') and not exists(select 1 from private.memberships where organization_id=p_org and user_id=u) then raise exception 'المجموعة متاحة لأعضائها فقط.' using errcode='42501';end if;
 return coalesce((select jsonb_agg(to_jsonb(x)) from(select p.id,p.username,p.display_name,(select count(*) from private.progress g where g.user_id=p.id) total from private.profiles p join private.memberships m on m.user_id=p.id where m.organization_id=p_org and p.status='approved' order by p.username)x),'[]'::jsonb);
end $$;

-- Server-only notification endpoints. No website token can call these.
create function public.email_recipients(p_date date) returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
 select p.id,p.display_name,u.email,s.daily_email,s.reminder_email,
 (select to_jsonb(pl) from private.plans pl where user_id=p.id) plan,
 coalesce((select jsonb_agg(chapter_id) from private.progress where user_id=p.id),'[]'::jsonb) done
 from private.profiles p join auth.users u on u.id=p.id join private.preferences s on s.user_id=p.id
 where p.status='approved' and u.email_confirmed_at is not null and (s.daily_email or s.reminder_email)
 and not exists(select 1 from private.email_log l where l.user_id=p.id and l.send_date=p_date) order by p.id
 limit (select greatest(0,90-count(*)) from private.email_log where send_date=p_date)
 )x
$$;
create function public.record_email(p_user uuid,p_date date,p_provider text) returns void language sql security definer set search_path='' as $$
 insert into private.email_log(user_id,send_date,provider_id) values(p_user,p_date,p_provider) on conflict do nothing
$$;

revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.dashboard(),public.save_plan(date,date,text),public.set_progress(text[],boolean),public.save_preferences(boolean,boolean),public.search_members(text),public.member_profile(text),public.send_encouragement(uuid,text),public.admin_overview(),public.manage_member(uuid,text),public.create_organization(text,text),public.set_membership(uuid,uuid,boolean),public.organization_members(uuid),public.email_recipients(date),public.record_email(uuid,date,text) from public,anon,authenticated;
grant execute on function public.dashboard(),public.save_plan(date,date,text),public.set_progress(text[],boolean),public.save_preferences(boolean,boolean),public.search_members(text),public.member_profile(text),public.send_encouragement(uuid,text),public.admin_overview(),public.manage_member(uuid,text),public.create_organization(text,text),public.set_membership(uuid,uuid,boolean),public.organization_members(uuid) to authenticated;
grant execute on function public.email_recipients(date),public.record_email(uuid,date,text) to service_role;
commit;
