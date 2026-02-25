export type SiteConfig = {
  key: string;
  name: string;
  primaryDomain: string;
  domainAliases: string[];
  defaultLocale: string;
  locales: string[];
};

export const sites: SiteConfig[] = [
  {
    key: "global",
    name: "Forte Digital Global",
    primaryDomain: "fortedigital.com",
    domainAliases: ["localhost:3000", "127.0.0.1:3000"],
    defaultLocale: "en",
    locales: ["en", "no"],
  },
];

export function findSiteByHost(host: string | null): SiteConfig {
  if (!host) {
    return sites[0];
  }

  const normalizedHost = host.toLowerCase();

  return (
    sites.find(
      (site) =>
        site.primaryDomain === normalizedHost ||
        site.domainAliases.includes(normalizedHost),
    ) ?? sites[0]
  );
}
