import "./globals.css";
import type { Metadata } from "next";
import { SupabaseProvider } from "@/components/supabase-provider";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Minimal PIM",
  description: "Headless PIM admin dashboard",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionUser();
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <div className="min-h-screen">
            <header className="border-b bg-white">
              <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
                <Link href="/" className="font-semibold">
                  Minimal PIM
                </Link>
                <div className="flex items-center gap-4 text-sm">
                  <nav className="flex gap-4">
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/dashboard/products">Products</Link>
                    <Link href="/dashboard/categories">Categories</Link>
                  </nav>
                  {profile ? <SignOutButton /> : <Link href="/login">Login</Link>}
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
