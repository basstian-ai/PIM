# fortedigital.com — Website + Admin (Supabase + Vercel)

This repository contains the new Forte Digital marketing website and a built-in admin experience for managing content directly in the app.

Key goals:
- Multi-locale language management (i18n)
- Multi-site / multi-market support (multiple domains and URL strategies)
- Content editing in the frontend and via custom admin pages (no external CMS)
- Supabase for database + auth
- Deploy to Vercel with preview deployments

> For agent guardrails and vibecoding rules, see `agents.md`.

---

## Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Database/Auth:** Supabase (Postgres, Auth, Storage optional)
- **Hosting:** Vercel
- **UI:** Choose one: Tailwind OR CSS Modules (do not mix)

---

## Architecture overview

### Web app (public)
- Server Components by default
- Locale-aware routing and rendering
- SEO-first metadata (canonical + hreflang + sitemaps)
- Fast page loads and minimal client JS

### Admin app (built-in)
- `/admin` route group
- Supabase Auth-protected (role-based access)
- CRUD for all content types (pages, cases, posts, events, navigation, settings)
- Draft / review / publish workflow (in DB)

---

## Internationalization (i18n)

We support both **locale** and **market/site** as separate dimensions:

- **site/market:** which domain/market this request belongs to (e.g. `fortedigital.com`, `fortedigital.no`, `fortedigital.de`)
- **locale:** language variant within a site (e.g. `en`, `no`, `de`)

We must not hardcode text; it must come from:
- translation dictionaries (UI chrome), and/or
- database content (page copy, titles, etc.)

---

## URL strategy (pick one and stay consistent)

Supported patterns (configured in `site.config.ts`):
1. **Domain per market:** `fortedigital.no` (default locale `no`), `fortedigital.com` (default locale `en`)
2. **Path per locale:** `/no`, `/en`, `/de`
3. Mixed domain + optional locale paths (only if explicitly required)

SEO requirements apply to all:
- canonical URL per page
- `hreflang` links across all available locale variants
- sitemaps per site/locale

---

## Content model (minimum)

The database must support:
- **Page** (flexible landing pages)
- **Case**
- **Service**
- **Post/News**
- **Event**
- **Office/Location**
- **Global settings** (navigation, footer, default SEO)
- **Site/market settings** (domain, enabled locales, default locale)

Common fields:
- `id`, `slug`, `status` (`draft|review|published|archived`)
- `site_id`, `locale`
- `title`, `seo_title`, `seo_description`
- `content` (structured JSON blocks or MDX-like blocks stored as JSON)
- `published_at`, `updated_at`

---

## Database schema proposal (Postgres/Supabase)

Below is a concrete baseline schema that matches multi-site + multi-locale + draft/publish + SEO requirements.

```sql
-- Optional extensions
create extension if not exists pgcrypto;

-- enums
create type content_status as enum ('draft', 'review', 'published', 'archived');
create type content_type as enum ('page', 'case', 'service', 'post', 'event');
create type nav_location as enum ('header', 'footer', 'sidebar', 'legal');
create type app_role as enum ('admin', 'editor', 'viewer');

-- markets/sites
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,                -- e.g. "global", "no", "de"
  name text not null,
  primary_domain text not null unique,     -- e.g. fortedigital.com
  domain_aliases text[] not null default '{}',
  default_locale text not null,            -- FK added after locales table
  enabled boolean not null default true,
  locale_strategy text not null default 'domain', -- domain|path|mixed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- locales
create table public.locales (
  code text primary key,                   -- e.g. en, nb, no, de
  name text not null,
  is_rtl boolean not null default false,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.sites
  add constraint sites_default_locale_fk
  foreign key (default_locale) references public.locales(code);

-- site-locale matrix
create table public.site_locales (
  site_id uuid not null references public.sites(id) on delete cascade,
  locale text not null references public.locales(code),
  is_default boolean not null default false,
  enabled boolean not null default true,
  primary key (site_id, locale)
);

create unique index site_locales_one_default_per_site
  on public.site_locales (site_id)
  where is_default;

-- reusable SEO + slugged content table for pages/cases/posts/events/services
create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  type content_type not null,
  site_id uuid not null references public.sites(id) on delete cascade,
  locale text not null references public.locales(code),
  slug text not null,
  status content_status not null default 'draft',
  title text not null,
  excerpt text,
  seo_title text,
  seo_description text,
  seo_image_url text,
  content jsonb not null default '{}'::jsonb,
  canonical_override text,
  noindex boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, site_id, locale, slug)
);

create index content_entries_public_idx
  on public.content_entries (type, site_id, locale, status, published_at desc);

-- optional localized office/location content
create table public.offices (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  locale text not null references public.locales(code),
  slug text not null,
  name text not null,
  address jsonb not null default '{}'::jsonb,
  geo jsonb,
  seo_title text,
  seo_description text,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, locale, slug)
);

-- navigation (localized + site specific)
create table public.navigation_menus (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  locale text not null references public.locales(code),
  location nav_location not null,
  name text not null,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, locale, location)
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.navigation_menus(id) on delete cascade,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label text not null,
  href text not null,
  linked_content_id uuid references public.content_entries(id) on delete set null,
  position int not null default 0,
  is_external boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- global + per-site settings
create table public.global_settings (
  id boolean primary key default true check (id = true),
  default_seo jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  site_id uuid primary key references public.sites(id) on delete cascade,
  locale text not null references public.locales(code),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- roles (mapped to Supabase Auth users)
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  site_id uuid references public.sites(id) on delete cascade, -- null = global role
  created_at timestamptz not null default now(),
  primary key (user_id, role, site_id)
);

-- helper function
create or replace function public.has_role(_user_id uuid, _roles app_role[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = any(_roles)
  );
$$;
```

### RLS policy sketches (minimum)

```sql
alter table public.content_entries enable row level security;
alter table public.navigation_menus enable row level security;
alter table public.navigation_items enable row level security;
alter table public.offices enable row level security;
alter table public.site_settings enable row level security;
alter table public.user_roles enable row level security;

-- Public read: published only
create policy "public can read published content"
on public.content_entries for select
using (status = 'published');

create policy "public can read published offices"
on public.offices for select
using (status = 'published');

create policy "public can read published navigation"
on public.navigation_menus for select
using (status = 'published');

create policy "public can read navigation items"
on public.navigation_items for select
using (
  exists (
    select 1 from public.navigation_menus m
    where m.id = navigation_items.menu_id
      and m.status = 'published'
  )
);

-- Admin/editor/viewer read access
create policy "authenticated can read admin content"
on public.content_entries for select
to authenticated
using (public.has_role(auth.uid(), array['admin','editor','viewer']::app_role[]));

-- Admin/editor write access
create policy "editor+ can insert content"
on public.content_entries for insert
to authenticated
with check (public.has_role(auth.uid(), array['admin','editor']::app_role[]));

create policy "editor+ can update content"
on public.content_entries for update
to authenticated
using (public.has_role(auth.uid(), array['admin','editor']::app_role[]))
with check (public.has_role(auth.uid(), array['admin','editor']::app_role[]));

-- Admin-only destructive ops
create policy "admin can delete content"
on public.content_entries for delete
to authenticated
using (public.has_role(auth.uid(), array['admin']::app_role[]));

-- user_roles table locked down (server/service role or admin via RPC)
create policy "users can read own roles"
on public.user_roles for select
to authenticated
using (user_id = auth.uid());
```

### Notes for hreflang + sitemap generation

- `site_locales` defines all valid locale variants per market/site.
- `content_entries` with `status = 'published'` is the only source for sitemap URLs.
- `hreflang` alternate set per page can be generated by matching `(type, site_id, slug)` across locales.
- Canonical defaults to current site domain + localized path unless `canonical_override` is set.

---

## Getting started

### Prerequisites
- Node 20+
- pnpm
- Supabase project (local or cloud)

### Install
```bash
pnpm install
```

### Environment variables

Copy `.env.example` → `.env.local` and fill in values.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SITE_BASE_URL` (used for canonical + sitemaps)
- `REVALIDATE_SECRET` (for on-demand revalidation)

### Run locally

```bash
pnpm dev
```

---

## Database migrations

We use Supabase migrations as the source of truth.

Typical workflow:
- add migration in `supabase/migrations`
- run locally with Supabase CLI (recommended)
- apply in CI/CD for production

---

## Auth & roles (admin)

Admin UI is protected using Supabase Auth and app-level RBAC.

Minimum roles:
- `admin` (full access)
- `editor` (create/edit content, publish if allowed)
- `viewer` (read-only)

---

## Publishing & cache invalidation

Publishing content must:
- update status + `published_at`
- trigger Next.js on-demand revalidation (or tag-based revalidate)
- keep SEO outputs correct (sitemaps, hreflang, canonical)

---

## Testing and quality gates

Required in CI:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm e2e` (Playwright)

Minimum E2E coverage:
- home
- cases list + detail
- posts list + detail
- contact
- 404

---

## Deployment (Vercel)

- `main` → production
- PR branches → preview deployments

Vercel env vars must mirror `.env.example`.
Never expose server secrets to the client.

---

## Contributing

See `agents.md` for guardrails and agent workflow.
