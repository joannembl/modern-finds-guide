create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
create policy "Owners can check their membership" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 200),
  category text not null check (category in ('Car Finds', 'Home', 'Pets', 'Tech', 'Maker/3D Printing')),
  description text not null check (length(trim(description)) between 1 and 600),
  notes text not null default '',
  image_url text not null default '' check (image_url = '' or image_url ~ '^https://'),
  affiliate_url text not null check (affiliate_url ~* '^https://(amzn\.to|([a-z0-9-]+\.)?amazon\.(com|ca|co\.uk|de|fr|it|es|co\.jp|com\.au|in))(/|\?|#|$)'),
  display_text text not null default 'Check price on Amazon' check (length(display_text) <= 80),
  tags text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_public_order on public.products (sort_order, title) where published;
alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
create policy "Visitors read published finds" on public.products for select to anon, authenticated using (published);
create policy "Owners read all finds" on public.products for select to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create policy "Owners insert finds" on public.products for insert to authenticated with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create policy "Owners update finds" on public.products for update to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create policy "Owners delete finds" on public.products for delete to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
create function public.set_product_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_product_updated_at() from public, anon, authenticated;
create trigger products_updated_at before update on public.products for each row execute function public.set_product_updated_at();
