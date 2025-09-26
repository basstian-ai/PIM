import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types.generated";
import type { Profile, ProfileRole } from "./types";

export async function getSessionUser() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) return null;

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { data } = await supabase.auth.getUser(accessToken);
  if (!data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const role = profile?.role ?? "viewer";
  const result: Profile = {
    userId: data.user.id,
    role: role as ProfileRole,
  };
  return result;
}
