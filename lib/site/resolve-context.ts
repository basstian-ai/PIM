import { findSiteByHost } from "@/site.config";

export function resolveLocale(siteLocales: string[], requestedLocale?: string): string {
  if (!requestedLocale) {
    return siteLocales[0];
  }

  if (!siteLocales.includes(requestedLocale)) {
    throw new Error(`Unsupported locale segment: ${requestedLocale}`);
  }

  return requestedLocale;
}

export function resolveSiteAndLocale(host: string | null, requestedLocale?: string) {
  const site = findSiteByHost(host);
  const locale = resolveLocale(site.locales, requestedLocale ?? site.defaultLocale);

  return { site, locale };
}
