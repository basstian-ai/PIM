import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../types.generated";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const cookieOptions = {
    name: "sb-access-token",
    sameSite: "lax",
    secure: false,
    path: "/",
    domain: undefined as string | undefined,
  };

  return createRouteHandlerClient<Database>(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      cookieOptions,
    }
  );
}
