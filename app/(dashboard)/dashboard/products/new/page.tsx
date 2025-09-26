import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ProductForm } from "@/components/product-form";

export default async function NewProductPage() {
  const profile = await getSessionUser();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Create product</h1>
      <ProductForm />
    </div>
  );
}
