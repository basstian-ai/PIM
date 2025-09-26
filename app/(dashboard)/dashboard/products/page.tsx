import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listProducts } from "@/lib/data/products";

export default async function ProductsPage() {
  const profile = await getSessionUser();
  if (!profile || !["admin", "editor"].includes(profile.role)) {
    redirect("/login");
  }

  const products = await listProducts({ includeDrafts: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-slate-600">Total: {products.total}</p>
        </div>
        <Link href="/dashboard/products/new" className="rounded bg-blue-600 px-4 py-2 text-white">
          New product
        </Link>
      </div>
      <div className="table">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Status</th>
              <th>Default price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {products.items.map((product) => {
              const defaultVariant = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
              return (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td>{product.sku}</td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase">
                      {product.status}
                    </span>
                  </td>
                  <td>
                    {defaultVariant
                      ? `${(defaultVariant.price.amountCents / 100).toFixed(2)} ${defaultVariant.price.currency}`
                      : "—"}
                  </td>
                  <td>{defaultVariant ? defaultVariant.stockOnHand : "—"}</td>
                  <td className="text-right">
                    <Link className="text-blue-600" href={`/dashboard/products/${product.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
