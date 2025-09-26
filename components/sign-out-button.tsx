"use client";

import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/supabase-provider";

export function SignOutButton() {
  const router = useRouter();
  const supabase = useSupabase();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className="rounded border border-slate-300 bg-white px-3 py-1 text-sm">
      Sign out
    </button>
  );
}
