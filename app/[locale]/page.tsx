import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import styles from "./public.module.css";
import { buildLocaleMetadata } from "@/lib/site/seo";
import { resolveSiteAndLocale } from "@/lib/site/resolve-context";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

async function resolveContext(requestedLocale: string) {
  const host = (await headers()).get("host");

  return resolveSiteAndLocale(host, requestedLocale);
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;

  try {
    const { site, locale } = await resolveContext(requestedLocale);

    return buildLocaleMetadata({
      title: "Forte Digital MVP",
      description: "Public web baseline for localized pages.",
      site,
      locale,
      pathname: "",
    });
  } catch {
    return {};
  }
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale: requestedLocale } = await params;

  let site: ReturnType<typeof resolveSiteAndLocale>["site"];
  let locale: ReturnType<typeof resolveSiteAndLocale>["locale"];

  try {
    ({ site, locale } = await resolveContext(requestedLocale));
  } catch {
    notFound();
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Forte Digital MVP</h1>
        <p className={styles.meta}>
          Site: {site.key} · Domain: {site.primaryDomain} · Locale: {locale}
        </p>
        <nav className={styles.nav}>
          <Link href={`/${locale}/cases`}>Cases</Link>
          <Link href={`/${locale}/posts`}>Posts</Link>
          <Link href={`/${locale}/contact`}>Contact</Link>
        </nav>
      </main>
    </div>
  );
}
