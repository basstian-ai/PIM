import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";

export async function ensureAdmin() {
  const profile = await getSessionUser();
  if (!profile || profile.role !== "admin") {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  return { profile } as const;
}
