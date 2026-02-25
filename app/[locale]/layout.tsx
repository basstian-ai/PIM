import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { resolveSiteAndLocale } from "@/lib/site/resolve-context";

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: requestedLocale } = await params;
  const host = (await headers()).get("host");

  try {
    resolveSiteAndLocale(host, requestedLocale);
  } catch {
    notFound();
  }

  return <>{children}</>;
}
