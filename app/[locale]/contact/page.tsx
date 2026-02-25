import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { getPublishedEntry } from "@/lib/content/public-content";
import { buildLocaleMetadata } from "@/lib/site/seo";
import { resolveSiteAndLocale } from "@/lib/site/resolve-context";

import styles from "../public.module.css";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const host = (await headers()).get("host");
  const { site, locale } = resolveSiteAndLocale(host, requestedLocale);

  return buildLocaleMetadata({
    title: "Contact",
    description: "Get in touch with Forte Digital.",
    site,
    locale,
    pathname: "/contact",
  });
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const entry = getPublishedEntry("page", locale, "contact");

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
