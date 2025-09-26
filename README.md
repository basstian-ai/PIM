# Minimal PIM

A composable product information management (PIM) service built with Next.js and Supabase. It exposes a REST API for storefront adapters and provides an admin dashboard for managing products, variants, categories, and media.

## Features

- Supabase Postgres schema with SQL migrations and seed data
- Supabase Auth (email/password) with role-based access control
- Next.js App Router backend with REST endpoints under `/api`
- Admin dashboard built with Next.js + Tailwind CSS
- Supabase Storage integration for product images
- OpenAPI 3.1 specification for the REST API
- Minimal Vitest coverage for API pagination and DTO mappers

## Getting started

### 1. Create a Supabase project

1. Sign in to [Supabase](https://supabase.com) and create a new project.
2. Note the project URL, anon key, and service role key from the API settings.

### 2. Configure the database

1. Run the migration:

   ```sql
   -- sql/migrations/001_init.sql
   ```

   You can copy the file contents into the Supabase SQL editor or run via the Supabase CLI.

2. Seed sample data:

   ```sql
   -- sql/seed/001_seed.sql
   ```

### 3. Set up storage

Create a public bucket named `product-media` in Supabase Storage. Enable public access so uploaded assets can be served directly.

### 4. Create an admin user

1. Sign up via the `/login` page.
2. Promote the new user to admin by running:

   ```sql
   insert into public.profiles (user_id, role)
   values ('<auth-user-uuid>', 'admin')
   on conflict (user_id) do update set role = 'admin';
   ```

   Replace `<auth-user-uuid>` with the `auth.users.id` of your account (visible in Supabase Auth > Users).

### 5. Environment variables

Copy `.env.example` to `.env.local` and fill in the keys from Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Install dependencies & run

```bash
npm install
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` – Start the Next.js dev server
- `npm run build` – Build the production bundle
- `npm run start` – Run the production server
- `npm run lint` – Lint using ESLint
- `npm run test` – Run Vitest unit tests

## REST API

The API is documented in [`openapi.yaml`](./openapi.yaml). A quick preview of the main endpoints:

- `GET /api/health`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{idOrSlug}`
- `PUT /api/products/{id}`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

Sample requests are available in [`requests.http`](./requests.http).

## Testing

```bash
npm run test
```

Vitest covers the product DTO mappers and the products API pagination logic.

## Project structure

```
app/                # Next.js app router (API + dashboard)
components/         # UI and client helpers
lib/                # Shared domain types, Supabase helpers, data loaders
sql/migrations/     # Database migrations
sql/seed/           # Seed data
tests/              # Vitest suites
openapi.yaml        # REST contract
requests.http       # Sample HTTP requests
```

## Security

- Row Level Security policies ensure published products are public while write operations require admin role.
- The Supabase service role key is only used in server components/route handlers.
- Client-side operations rely on Supabase Auth cookies for session management.

## Extending

The codebase is intentionally lean. Add new entities by extending the SQL schema, updating the generated types, and mapping them via the existing DTO helpers. The dashboard uses simple React components, making it easy to customise or replace with your preferred UI kit.
