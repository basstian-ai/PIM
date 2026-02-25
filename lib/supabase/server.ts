import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
