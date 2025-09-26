create extension if not exists "pgcrypto";

do $$ begin
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type product_status as enum ('draft','published','archived');
  end if;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories,
  path text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  slug text not null unique,
  description text,
  status product_status not null default 'draft',
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products on delete cascade,
  category_id uuid not null references public.categories on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text,
  width int,
  height int,
  mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.product_assets (
  product_id uuid not null references public.products on delete cascade,
  asset_id uuid not null references public.assets on delete cascade,
  role text not null check (role in ('primary','gallery')),
  sort_order int not null default 0,
  primary key (product_id, asset_id, role)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  sku text unique,
  title text,
  attributes jsonb not null default '{}'::jsonb,
  price_cents int not null,
  currency text not null default 'NOK',
  stock_on_hand int not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_categories_category_id on public.product_categories(category_id);
create index if not exists idx_products_status_slug on public.products(status, slug);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.categories enable row level security;
alter table public.assets enable row level security;
alter table public.product_assets enable row level security;

create policy if not exists "read_published_products" on public.products
for select using (
  status = 'published'
  or exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role in ('admin','editor')
  )
);

create policy if not exists "read_variants_if_parent_readable" on public.product_variants
for select using (
  exists (select 1 from public.products pr
          where pr.id = product_variants.product_id
          and (pr.status='published' or exists (
              select 1 from public.profiles p
              where p.user_id = auth.uid() and p.role in ('admin','editor')
          )))
);

create policy if not exists "read_categories" on public.categories for select using (true);
create policy if not exists "read_assets" on public.assets for select using (true);
create policy if not exists "read_product_assets" on public.product_assets for select using (true);

create policy if not exists "write_products_admin" on public.products
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));

create policy if not exists "write_variants_admin" on public.product_variants
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));

create policy if not exists "write_categories_admin" on public.categories
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));

create policy if not exists "write_assets_admin" on public.assets
for all using (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role='admin'));
