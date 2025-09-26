import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types.generated";

export function createSupabaseBrowserClient() {
  return createClientComponentClient<Database>();
}
