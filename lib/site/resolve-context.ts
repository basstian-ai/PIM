import { findSiteByHost } from "@/site.config";

export function resolveLocale(siteLocales: string[], requestedLocale?: string): string {
  if (!requestedLocale) {
    return siteLocales[0];
  }

  return siteLocales.includes(requestedLocale) ? requestedLocale : siteLocales[0];
}

export function resolveSiteAndLocale(host: string | null, requestedLocale?: string) {
  const site = findSiteByHost(host);
  const locale = resolveLocale(site.locales, requestedLocale ?? site.defaultLocale);

  return { site, locale };
}
