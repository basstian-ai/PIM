import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { listPublishedEntries } from "@/lib/content/public-content";
import { buildLocaleMetadata } from "@/lib/site/seo";
import { resolveSiteAndLocale } from "@/lib/site/resolve-context";

import styles from "../public.module.css";

type PostsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PostsPageProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const host = (await headers()).get("host");
  const { site, locale } = resolveSiteAndLocale(host, requestedLocale);

  return buildLocaleMetadata({
    title: "Posts",
    description: "Published updates and news.",
    site,
    locale,
    pathname: "/posts",
  });
}

export default async function PostsPage({ params }: PostsPageProps) {
  const { locale } = await params;
  const entries = listPublishedEntries("post", locale);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Posts</h1>
        <ul className={styles.list}>
          {entries.map((entry) => (
            <li key={entry.slug}>
              <Link href={`/${locale}/posts/${entry.slug}`}>{entry.title}</Link>
              <p className={styles.meta}>{entry.summary}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
