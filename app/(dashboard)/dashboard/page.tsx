import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardHome() {
  const profile = await getSessionUser();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-slate-600">Manage products, categories, and media.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/dashboard/products" className="rounded-lg border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-slate-600">Review and edit your catalog.</p>
        </Link>
        <Link href="/dashboard/categories" className="rounded-lg border border-slate-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Categories</h2>
          <p className="text-sm text-slate-600">Keep the navigation tree organized.</p>
        </Link>
      </div>
    </div>
  );
}
