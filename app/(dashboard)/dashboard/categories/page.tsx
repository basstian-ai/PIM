import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { CategoryManager } from "@/components/category-manager";

export default async function CategoriesPage() {
  const profile = await getSessionUser();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <CategoryManager />
    </div>
  );
}
