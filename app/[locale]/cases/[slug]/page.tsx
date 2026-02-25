import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getPublishedEntry } from "@/lib/content/public-content";
import { buildLocaleMetadata } from "@/lib/site/seo";
import { resolveSiteAndLocale } from "@/lib/site/resolve-context";

import styles from "../../public.module.css";

type CaseDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: CaseDetailPageProps): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  const host = (await headers()).get("host");
  const { site, locale } = resolveSiteAndLocale(host, requestedLocale);

  const entry = getPublishedEntry("case", locale, slug);
  if (!entry) {
    return {};
  }

  return buildLocaleMetadata({
    title: entry.title,
    description: entry.summary,
    site,
    locale,
    pathname: `/cases/${slug}`,
  });
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { locale, slug } = await params;
  const entry = getPublishedEntry("case", locale, slug);

  if (!entry) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>{entry.title}</h1>
        <p className={styles.meta}>{entry.body}</p>
      </main>
    </div>
  );
}
