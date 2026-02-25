import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { findSiteByHost } from "@/site.config";

export default async function RootPage() {
  const host = (await headers()).get("host");
  const site = findSiteByHost(host);

  redirect(`/${site.defaultLocale}`);
}
