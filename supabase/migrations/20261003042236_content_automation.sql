alter table public.products add column source_key text unique, add column seo_title text not null default '', add column seo_description text not null default '', add column key_features text[] not null default '{}', add column placements text[] not null default '{}';
create table public.content_templates (id text primary key, name text not null, settings jsonb not null default '{}',created_at timestamptz not null default now());
insert into public.content_templates(id,name) values ('hero','Single-product hero'),('list','List pin'),('problem','Problem / solution'),('collage','Editorial collage');
create table public.content_queue (id uuid primary key default gen_random_uuid(), product_id uuid not null unique references public.products on delete cascade, product_ids uuid[] not null, status text not null default 'Draft' check(status in ('Draft','Approved','Published')), website jsonb not null, created_at timestamptz not null default now());
create table public.media_assets (id uuid primary key default gen_random_uuid(), queue_id uuid not null references public.content_queue on delete cascade, platform text not null, format text not null, template text not null, svg text not null, status text not null default 'Draft' check(status in ('Draft','Approved')), provenance text not null default 'Branded typography; no product depiction', created_at timestamptz not null default now());
create table public.social_posts (id uuid primary key default gen_random_uuid(), queue_id uuid not null references public.content_queue on delete cascade, platform text not null check(platform in ('Pinterest','Instagram')), status text not null default 'Draft' check(status in ('Draft','Approved','Scheduled','Published')), title text not null, description text not null, destination_url text not null check(destination_url ~ '^https?://'), board text not null default '', alt_text text not null, hashtags text not null default '', cta text not null default '', product_ids uuid[] not null, scheduled_at timestamptz, published_url text, created_at timestamptz not null default now(), unique(queue_id,platform),check(status <> 'Scheduled' or scheduled_at is not null), check(status <> 'Published' or published_url ~ '^https://'));
do $$ declare t text; begin foreach t in array array['content_queue','social_posts','media_assets','content_templates'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy owner_access on public.%I for all to authenticated using (exists(select 1 from public.admin_users where user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users where user_id=(select auth.uid())))',t);
 end loop; end $$;
create function public.create_content_pack(product_ids uuid[], pack jsonb, assets jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare q uuid; item jsonb; begin
 if not exists(select 1 from public.admin_users where user_id=auth.uid()) then raise exception 'Owner access required'; end if;
 insert into public.content_queue(product_id,product_ids,website) values(product_ids[1],product_ids,pack->'website') returning id into q;
 for item in select * from jsonb_array_elements(pack->'posts') loop
 insert into public.social_posts(queue_id,platform,title,description,destination_url,board,alt_text,hashtags,cta,product_ids) values(q,item->>'platform',item->>'title',item->>'description',item->>'destination_url',item->>'board',item->>'alt_text',item->>'hashtags',item->>'cta',product_ids); end loop;
 for item in select * from jsonb_array_elements(assets) loop insert into public.media_assets(queue_id,platform,format,template,svg) values(q,item->>'platform',item->>'format',item->>'template',item->>'svg'); end loop; return q;
end $$;
create function public.approve_site_content(queue_id uuid) returns void language plpgsql security invoker set search_path='' as $$
declare q public.content_queue; begin
 select * into q from public.content_queue where id=queue_id for update;
 if q.id is null or q.status <> 'Approved' then raise exception 'Approve website copy first';end if;
 update public.products set title=q.website->>'title',description=q.website->>'description',notes=q.website->>'notes',category=q.website->>'category',display_text=q.website->>'display_text',tags=array(select jsonb_array_elements_text(q.website->'tags')),key_features=array(select jsonb_array_elements_text(q.website->'key_features')),placements=array(select jsonb_array_elements_text(q.website->'placements')),seo_title=q.website->>'seo_title',seo_description=q.website->>'seo_description',published=true where id=q.product_id;
 update public.content_queue set status='Published' where id=queue_id;
end $$;
create function public.guard_social_approval() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if new.status in ('Scheduled','Published') and (TG_OP='INSERT' or old.status not in ('Approved','Scheduled')) then raise exception 'Approve social content first';end if;
 if new.status in ('Approved','Scheduled') and (not exists(select 1 from public.media_assets where queue_id=new.queue_id and platform=new.platform and status='Approved') or not exists(select 1 from public.content_queue where id=new.queue_id and status='Published')) then raise exception 'Publish website and approve media first';end if;
 if TG_OP='UPDATE' and (new.title,new.description,new.destination_url,new.alt_text,new.hashtags,new.cta) is distinct from (old.title,old.description,old.destination_url,old.alt_text,old.hashtags,old.cta) then new.status='Draft';new.scheduled_at=null;end if;
 return new;end $$;
create trigger social_approval before insert or update on public.social_posts for each row execute function public.guard_social_approval();
revoke execute on function public.create_content_pack(uuid[],jsonb,jsonb),public.approve_site_content(uuid),public.guard_social_approval() from public,anon;
grant execute on function public.create_content_pack(uuid[],jsonb,jsonb),public.approve_site_content(uuid) to authenticated;
create function public.invalidate_content_review() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if TG_TABLE_NAME='content_queue' then
 if new.website is distinct from old.website then
 new.status='Draft';
 update public.social_posts set status='Draft',scheduled_at=null where queue_id=new.id and status <> 'Published';
 end if;
 elsif TG_TABLE_NAME='media_assets' then
 if (new.svg,new.template) is distinct from (old.svg,old.template) then
 new.status='Draft';
 update public.social_posts set status='Draft',scheduled_at=null where queue_id=new.queue_id and platform=new.platform and status <> 'Published';
 end if;end if;return new;end $$;
create trigger queue_review before update on public.content_queue for each row execute function public.invalidate_content_review();
create trigger media_review before update on public.media_assets for each row execute function public.invalidate_content_review();
revoke execute on function public.invalidate_content_review() from public,anon,authenticated;
