import type { MetadataRoute } from "next";

import { listAllPublishedEntries } from "@/lib/content/public-content";
import { sites } from "@/site.config";

function buildAbsoluteUrl(domain: string, pathname: string) {
  return `https://${domain}${pathname}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const items: MetadataRoute.Sitemap = [];

  for (const site of sites) {
    for (const locale of site.locales) {
      items.push(
        { url: buildAbsoluteUrl(site.primaryDomain, `/${locale}`) },
        { url: buildAbsoluteUrl(site.primaryDomain, `/${locale}/cases`) },
        { url: buildAbsoluteUrl(site.primaryDomain, `/${locale}/posts`) },
      );

      const publishedEntries = listAllPublishedEntries(site.key, locale);

      for (const entry of publishedEntries) {
        if (entry.type === "case") {
          items.push({
            url: buildAbsoluteUrl(site.primaryDomain, `/${locale}/cases/${entry.slug}`),
          });
        }

        if (entry.type === "post") {
          items.push({
            url: buildAbsoluteUrl(site.primaryDomain, `/${locale}/posts/${entry.slug}`),
          });
        }

        if (entry.type === "page" && entry.slug === "contact") {
          items.push({
            url: buildAbsoluteUrl(site.primaryDomain, `/${locale}/contact`),
          });
        }
      }
    }
  }

  return items;
}
