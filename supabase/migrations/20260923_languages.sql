begin;
alter table private.preferences add column if not exists ui_language text not null default 'ar' check(ui_language in ('ar','en','fr','de'));
alter table private.preferences add column if not exists bible_language text not null default 'ar' check(bible_language in ('ar','en','fr','de'));
create or replace function public.save_languages(p_ui text,p_bible text) returns void language plpgsql security definer set search_path='' as $$
declare u uuid:=private.require_member();
begin
 if p_ui is null or p_bible is null or p_ui not in ('ar','en','fr','de') or p_bible not in ('ar','en','fr','de') then raise exception 'Invalid language';end if;
 insert into private.preferences(user_id,ui_language,bible_language) values(u,p_ui,p_bible)
 on conflict(user_id) do update set ui_language=excluded.ui_language,bible_language=excluded.bible_language;
end $$;
revoke all on function public.save_languages(text,text) from public,anon,authenticated;
grant execute on function public.save_languages(text,text) to authenticated;
create or replace function public.email_recipients(p_date date) returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
 select p.id,p.display_name,u.email,s.daily_email,s.reminder_email,s.ui_language,s.bible_language,
 (select to_jsonb(pl) from private.plans pl where user_id=p.id) plan,
 coalesce((select jsonb_agg(chapter_id) from private.progress where user_id=p.id),'[]'::jsonb) done
 from private.profiles p join auth.users u on u.id=p.id join private.preferences s on s.user_id=p.id
 where p.status='approved' and u.email_confirmed_at is not null and (s.daily_email or s.reminder_email)
 and not exists(select 1 from private.email_log l where l.user_id=p.id and l.send_date=p_date) order by p.id
 limit (select greatest(0,90-count(*)) from private.email_log where send_date=p_date)
 )x
$$;
revoke all on function public.email_recipients(date) from public,anon,authenticated;
grant execute on function public.email_recipients(date) to service_role;
-- Reserve a daily attempt before contacting a provider. Unknown delivery outcomes
-- are not automatically retried after the provider's short deduplication window.
create or replace function public.claim_email(p_user uuid,p_date date) returns boolean language plpgsql security definer set search_path='' as $$
declare claimed uuid;
begin
 insert into private.email_log(user_id,send_date,provider_id) values(p_user,p_date,'pending') on conflict do nothing returning user_id into claimed;
 return claimed is not null;
end $$;
create or replace function public.record_email(p_user uuid,p_date date,p_provider text) returns void language sql security definer set search_path='' as $$
 insert into private.email_log(user_id,send_date,provider_id) values(p_user,p_date,p_provider)
 on conflict(user_id,send_date) do update set provider_id=excluded.provider_id,sent_at=now()
$$;
revoke all on function public.claim_email(uuid,date),public.record_email(uuid,date,text) from public,anon,authenticated;
grant execute on function public.claim_email(uuid,date),public.record_email(uuid,date,text) to service_role;
commit;
