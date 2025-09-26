import type { Database } from "./types.generated";
import type { Category, Image, Product, Variant } from "./types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type AssetRow = Database["public"]["Tables"]["assets"]["Row"];
type ProductAssetRow = Database["public"]["Tables"]["product_assets"]["Row"];

export function mapVariant(row: VariantRow): Variant {
  return {
    id: row.id,
    sku: row.sku ?? undefined,
    title: row.title ?? undefined,
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    price: {
      amountCents: row.price_cents,
      currency: row.currency,
    },
    stockOnHand: row.stock_on_hand,
    isDefault: row.is_default,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parent_id,
    path: row.path ?? undefined,
  };
}

export function mapImage(asset: AssetRow, relation: ProductAssetRow): Image {
  return {
    url: asset.url,
    alt: asset.alt ?? undefined,
  };
}

export function mapProduct(
  product: ProductRow,
  variants: VariantRow[],
  categories: CategoryRow[],
  assets: Array<{ asset: AssetRow; relation: ProductAssetRow }>
): Product {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    status: product.status,
    specs: (product.specs as Record<string, unknown>) ?? {},
    categories: categories.map(mapCategory),
    images: assets
      .sort((a, b) => a.relation.sort_order - b.relation.sort_order)
      .map((entry) => mapImage(entry.asset, entry.relation)),
    variants: variants
      .sort((a, b) => Number(b.is_default) - Number(a.is_default))
      .map(mapVariant),
  };
}
