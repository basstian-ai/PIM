# AGENTS.md — Guardrails for Codex / Agent-driven development

This file defines the rules for agents (Codex) working in this repository.

## 1) Non-negotiables

- No external CMS (no Sanity, Contentful, etc.). Content is managed via our own `/admin` pages.
- Supabase is the source of truth for content, users, roles, and publishing state.
- Deploy target is Vercel. Changes must be compatible with Vercel runtime constraints.
- Multi-site (market) + multi-locale (language) is core. Do not hardcode language or market assumptions.

## 2) Before making changes

- Read `readme.md` and relevant docs under `/docs`.
- Search for existing patterns and reuse them.
- Prefer small, incremental PR-sized changes (avoid massive refactors).

## 3) Next.js conventions

- Server Components by default.
- Use Client Components only when required (state, events, browser APIs).
- Fetch content server-side. Keep client bundles small.
- Use explicit caching/revalidation rules (document them when changed).

## 4) Routing, locale, and market rules

- Market (site) must be derived from host/domain and `site.config.ts`.
- Locale must be derived from route and/or site defaults, never from browser locale.
- For every page, ensure:
  - `html lang` is correct
  - canonical URL is correct for the current market+locale
  - hreflang alternates are produced for all available variants

Do not introduce a second i18n system.

## 5) Data & content rules (Supabase)

- All content types must include `site_id` and `locale`.
- Use RLS policies consistently:
  - public pages can read `published` content
  - admin requires authenticated user + role
- Use service role key only in server-only code paths.
- Never query Supabase directly from the client for privileged admin operations.

### Draft / publish workflow

- `draft` → editable, not publicly visible
- `review` → optional approval state
- `published` → visible on public site
- `archived` → not visible, kept for history

Publishing MUST trigger revalidation.

## 6) Admin rules

- `/admin` must require auth.
- RBAC required: at minimum `admin`, `editor`, `viewer`.
- Every write endpoint must validate input and permissions server-side.
- Prefer server actions or API routes for mutations (not direct client DB writes).

## 7) Security and privacy

- No secrets in the browser bundle.
- Do not log PII.
- Rate-limit public forms (contact/newsletter) and protect against spam (honeypot + throttling).
- Do not add tracking scripts without explicit requirements.

## 8) SEO guardrails

Every indexable page must have:
- title + description (per locale)
- canonical
- hreflang alternates
- structured data when applicable

Sitemaps:
- generate per market/locale
- include only `published` content
- do not include admin routes, preview routes, drafts, or review states

Redirects:
- URL changes must include a redirect plan in `docs/redirects.md`.

## 9) Quality gates

All changes must pass:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- relevant Playwright E2E tests

If tests fail, fix the root cause. Do not disable tests.

## 10) Change hygiene (how agents should work)

When assigned a task:
1. Identify the smallest change that solves it.
2. Implement with consistent patterns.
3. Add/adjust tests.
4. Update docs if you changed:
   - env vars
   - routing/locale/market behavior
   - content model / migrations
   - caching/revalidation
5. Provide a short verification guide:
   - commands to run
   - URLs to check
   - expected outputs

## 11) Explicitly forbidden (unless instructed)

- Switching framework or adding an external CMS.
- Introducing a second database or parallel content store.
- Changing URL strategy (domain/path) without updating SEO outputs and redirects.
- Adding new UI frameworks/state libraries without approval.
