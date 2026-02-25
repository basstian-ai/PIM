export type ContentType = "page" | "case" | "post";
export type ContentStatus = "draft" | "review" | "published" | "archived";

export type PublicContentEntry = {
  type: ContentType;
  locale: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  status: ContentStatus;
};

const entries: PublicContentEntry[] = [
  {
    type: "case",
    locale: "en",
    slug: "migrated-marketing-platform",
    title: "Migrated a global marketing platform",
    summary: "How we rebuilt content publishing across markets.",
    body: "This case highlights architecture, migration strategy, and measurable outcomes.",
    status: "published",
  },
  {
    type: "case",
    locale: "no",
    slug: "migrert-markedsplattform",
    title: "Migrerte en global markedsplattform",
    summary: "Hvordan vi bygget ny publiseringsflyt på tvers av markeder.",
    body: "Denne casen beskriver arkitekturvalg, migrering og målbare resultater.",
    status: "published",
  },
  {
    type: "post",
    locale: "en",
    slug: "launching-the-new-mvp",
    title: "Launching the new MVP",
    summary: "What is included in Sprint 2 and why.",
    body: "In this update we introduce localized routes for cases, posts, and contact pages.",
    status: "published",
  },
  {
    type: "post",
    locale: "no",
    slug: "lansering-av-ny-mvp",
    title: "Lansering av ny MVP",
    summary: "Dette leveres i Sprint 2 og hvorfor.",
    body: "I denne oppdateringen introduserer vi lokale ruter for case, innlegg og kontakt.",
    status: "published",
  },
  {
    type: "page",
    locale: "en",
    slug: "contact",
    title: "Contact",
    summary: "Get in touch with Forte Digital.",
    body: "Send us a message and we will respond shortly.",
    status: "published",
  },
  {
    type: "page",
    locale: "no",
    slug: "contact",
    title: "Kontakt",
    summary: "Ta kontakt med Forte Digital.",
    body: "Send oss en melding, så svarer vi så raskt som mulig.",
    status: "published",
  },
];

export function listPublishedEntries(type: ContentType, locale: string): PublicContentEntry[] {
  return entries.filter((entry) => entry.type === type && entry.locale === locale && entry.status === "published");
}

export function getPublishedEntry(type: ContentType, locale: string, slug: string): PublicContentEntry | undefined {
  return entries.find(
    (entry) =>
      entry.type === type &&
      entry.locale === locale &&
      entry.slug === slug &&
      entry.status === "published",
  );
}
