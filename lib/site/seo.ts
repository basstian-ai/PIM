import type { Metadata } from "next";

import type { SiteConfig } from "@/site.config";

function createAbsolutePath(site: SiteConfig, pathname: string) {
  return `https://${site.primaryDomain}${pathname}`;
}

export function buildLocaleMetadata({
  title,
  description,
  site,
  locale,
  pathname,
}: {
  title: string;
  description: string;
  site: SiteConfig;
  locale: string;
  pathname: string;
}): Metadata {
  const alternates: Record<string, string> = {};

  for (const supportedLocale of site.locales) {
    alternates[supportedLocale] = createAbsolutePath(site, `/${supportedLocale}${pathname}`);
  }

  return {
    title,
    description,
    alternates: {
      canonical: createAbsolutePath(site, `/${locale}${pathname}`),
      languages: alternates,
    },
  };
}
