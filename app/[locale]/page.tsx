import { headers } from "next/headers";
import { notFound } from "next/navigation";

import styles from "../page.module.css";
import { resolveSiteAndLocale } from "@/lib/site/resolve-context";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale: requestedLocale } = await params;
  const host = (await headers()).get("host");
  let site: ReturnType<typeof resolveSiteAndLocale>["site"];
  let locale: ReturnType<typeof resolveSiteAndLocale>["locale"];

  try {
    ({ site, locale } = resolveSiteAndLocale(host, requestedLocale));
  } catch {
    notFound();
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <p className={styles.badge}>Sprint 1 · Fundament</p>
        <h1 className={styles.title}>Forte Digital MVP er initialisert</h1>
        <ul className={styles.list}>
          <li>
            <strong>Site/market:</strong> {site.key}
          </li>
          <li>
            <strong>Domain:</strong> {site.primaryDomain}
          </li>
          <li>
            <strong>Locale:</strong> {locale}
          </li>
        </ul>
      </main>
    </div>
  );
}
