import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/auth-helpers-nextjs";
import { Database } from "../types.generated";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const cookieOptions: CookieOptions = {
    name: "sb-access-token",
    sameSite: "lax",
  };

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
      headers: {
        Authorization: headers().get("Authorization") ?? "",
      },
    }
  );
}
