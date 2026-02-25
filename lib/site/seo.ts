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
  localizedPathnames,
}: {
  title: string;
  description: string;
  site: SiteConfig;
  locale: string;
  pathname: string;
  localizedPathnames?: Partial<Record<string, string>>;
}): Metadata {
  const alternates: Record<string, string> = {};

  for (const supportedLocale of site.locales) {
    const localePath = localizedPathnames ? localizedPathnames[supportedLocale] : pathname;

    if (!localePath) {
      continue;
    }

    alternates[supportedLocale] = createAbsolutePath(site, `/${supportedLocale}${localePath}`);
  }

  const canonicalPath = localizedPathnames?.[locale] ?? pathname;

  return {
    title,
    description,
    alternates: {
      canonical: createAbsolutePath(site, `/${locale}${canonicalPath}`),
      languages: alternates,
    },
  };
}
