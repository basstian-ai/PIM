import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Minimal Product Information Management</h1>
      <p>
        This dashboard provides product and category management for headless storefronts via a clean REST API.
        Sign in to access the admin tools.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
          Go to login
        </Link>
        <Link href="/api/products" className="rounded border border-blue-600 px-4 py-2 text-blue-600">
          Explore API
        </Link>
      </div>
    </div>
  );
}
