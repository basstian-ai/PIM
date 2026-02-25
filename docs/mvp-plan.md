# MVP-plan for fortedigital.com (Website + Admin)

## Mål for MVP

Levere en første versjon som gjør det mulig å:

- publisere og vise innhold på offentlig nettside for ett marked/site
- støtte minst to språk (`en` + `no`)
- redigere innhold i innebygd `/admin` med rollebasert tilgang
- sikre grunnleggende SEO (canonical, hreflang, sitemap)
- drifte løsningen på Vercel med preview-deploys

---

## Scope i MVP (må med)

### Innholdstyper

- `page` (minst forside + kontakt)
- `case` (liste + detalj)
- `post` (liste + detalj)

### Roller i admin

- `admin` (full tilgang)
- `editor` (opprette/redigere/publisere)
- `viewer` (lese-tilgang)

### Publiseringsflyt

- `draft` → `review` → `published`

---

## Faseplan (4 sprinter)

## Sprint 1 — Fundament

**Leveranser**

- Next.js App Router + TypeScript + Supabase integrert
- migrasjoner for:
  - `sites`, `locales`, `site_locales`
  - `content_entries`
  - `user_roles`
- grunnleggende RLS-policyer
- market + locale-resolusjon via host/rute

**Akseptansekriterier**

- publisert innhold kan leses server-side
- `.env.local`-oppsett fungerer lokalt
- én testside rendrer riktig locale/market

## Sprint 2 — Public web

**Leveranser**

- sider:
  - `/`
  - `/cases` og `/cases/[slug]`
  - `/posts` og `/posts/[slug]`
  - `/contact`
- SSR-datainnhenting for publisert innhold
- SEO metadata per side
- 404-side

**Akseptansekriterier**

- sider fungerer på minst 2 locales
- canonical og hreflang genereres korrekt
- sitemap inkluderer kun publisert innhold

## Sprint 3 — Admin

**Leveranser**

- `/admin` med auth-beskyttelse
- RBAC i admin
- CRUD for `page`, `case`, `post`
- publiseringshandling som setter `published_at`
- on-demand revalidation etter publisering

**Akseptansekriterier**

- `viewer` kan lese, men ikke skrive
- `editor` kan opprette, redigere og publisere
- publisering oppdaterer offentlig side etter revalidation

## Sprint 4 — Stabilisering og lansering

**Leveranser**

- kvalitetssikring av locale/market/SEO
- CI med:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm e2e` (smoke)
- Vercel preview + produksjonsoppsett
- kort drift-/deploy-dokumentasjon

**Akseptansekriterier**

- grønne quality gates i CI
- preview-deploy fungerer for PR
- produksjonsdeploy fungerer med riktige env vars

---

## Ikke med i MVP (senere fase)

- flere markeder/domener samtidig
- events/offices og avansert navigasjonsbygger
- avansert mediehåndtering/workflows
- analytics utover grunnleggende behov

---

## Risikoer og tiltak

- **RLS-kompleksitet:** start med minimale policyer, utvid trinnvis
- **SEO/i18n-feil:** verifiser canonical/hreflang tidlig med tester
- **Sikkerhet i admin:** all skriving valideres server-side
- **Scope creep:** begrens til `page`, `case`, `post` i MVP

---

## Definition of Done (MVP)

- offentlig nettside + adminflyt fungerer ende-til-ende
- to locales støttes for ett site
- publisering oppdaterer liveinnhold korrekt
- SEO minimum oppfylt
- deploy + CI stabil
