import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProduct } from "@/lib/data/products";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const profile = await getSessionUser();
  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const product = await getProduct(params.id);
  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}
