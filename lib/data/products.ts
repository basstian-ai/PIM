import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { mapProduct } from "@/lib/mappers";
import type { PaginatedProducts, Product } from "@/lib/types";
import type { Database } from "@/lib/types.generated";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductCategoryRow = Database["public"]["Tables"]["product_categories"]["Row"];
type ProductAssetRow = Database["public"]["Tables"]["product_assets"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type AssetRow = Database["public"]["Tables"]["assets"]["Row"];

export async function listProducts(options: {
  page?: number;
  pageSize?: number;
  includeDrafts?: boolean;
}): Promise<PaginatedProducts> {
  const supabase = createSupabaseServerClient() as any;
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (!options.includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data: products, count, error } = await query;
  if (error) throw error;

  if (!products?.length) {
    return { page, pageSize, total: count ?? 0, items: [] } satisfies PaginatedProducts;
  }

  const productRows = (products ?? []) as ProductRow[];
  const ids = productRows.map((product) => product.id);
  const supabaseClient = createSupabaseServerClient() as any;
  const [variantsRes, categoriesRes, assetsRes, productCategoriesRes, productAssetsRes] = await Promise.all([
    supabaseClient.from("product_variants").select("*").in("product_id", ids),
    supabaseClient.from("categories").select("*"),
    supabaseClient.from("assets").select("*"),
    supabaseClient.from("product_categories").select("product_id, category_id").in("product_id", ids),
    supabaseClient.from("product_assets").select("product_id, asset_id, role, sort_order").in("product_id", ids),
  ]);

  if (variantsRes.error || categoriesRes.error || assetsRes.error || productCategoriesRes.error || productAssetsRes.error) {
    throw (
      variantsRes.error || categoriesRes.error || assetsRes.error || productCategoriesRes.error || productAssetsRes.error
    );
  }

  const variantRows = (variantsRes.data ?? []) as ProductVariantRow[];
  const categoryRows = (categoriesRes.data ?? []) as CategoryRow[];
  const assetRows = (assetsRes.data ?? []) as AssetRow[];
  const productCategoryRows = (productCategoriesRes.data ?? []) as ProductCategoryRow[];
  const productAssetRows = (productAssetsRes.data ?? []) as ProductAssetRow[];

  const categoriesById = new Map(categoryRows.map((category) => [category.id, category] as const));
  const assetsById = new Map(assetRows.map((asset) => [asset.id, asset] as const));

  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  for (const variant of variantRows) {
    const arr = variantsByProduct.get(variant.product_id) ?? [];
    arr.push(variant);
    variantsByProduct.set(variant.product_id, arr);
  }

  const categoriesByProduct = new Map<string, CategoryRow[]>();
  for (const row of productCategoryRows) {
    const category = categoriesById.get(row.category_id);
    if (!category) continue;
    const arr = categoriesByProduct.get(row.product_id) ?? [];
    arr.push(category);
    categoriesByProduct.set(row.product_id, arr);
  }

  const assetsByProduct = new Map<string, Array<{ asset: AssetRow; relation: ProductAssetRow }>>();
  for (const row of productAssetRows) {
    const asset = assetsById.get(row.asset_id);
    if (!asset) continue;
    const arr = assetsByProduct.get(row.product_id) ?? [];
    arr.push({ asset, relation: row });
    assetsByProduct.set(row.product_id, arr);
  }

  const items = productRows.map((product) =>
    mapProduct(
      product,
      variantsByProduct.get(product.id) ?? [],
      categoriesByProduct.get(product.id) ?? [],
      assetsByProduct.get(product.id) ?? []
    )
  );

  return { page, pageSize, total: count ?? items.length, items } satisfies PaginatedProducts;
}

export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const supabase = createSupabaseServerClient() as any;
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(idOrSlug);
  const { data: productRows, error } = isUuid
    ? await supabase.from("products").select("*").eq("id", idOrSlug)
    : await supabase.from("products").select("*").eq("slug", idOrSlug);
  if (error || !productRows?.[0]) {
    return null;
  }
  const product = productRows[0];
  const productId = product.id;

  const [variantsRes, productCategoriesRes, productAssetsRes] = await Promise.all([
    supabase.from("product_variants").select("*").eq("product_id", productId),
    supabase.from("product_categories").select("product_id, category_id").eq("product_id", productId),
    supabase.from("product_assets").select("product_id, asset_id, role, sort_order").eq("product_id", productId),
  ]);

  if (variantsRes.error || productCategoriesRes.error || productAssetsRes.error) {
    throw variantsRes.error || productCategoriesRes.error || productAssetsRes.error;
  }

  const productCategoryRows = (productCategoriesRes.data ?? []) as ProductCategoryRow[];
  const productAssetRows = (productAssetsRes.data ?? []) as ProductAssetRow[];

  const categoryIds = productCategoryRows.map((row) => row.category_id);
  const assetIds = productAssetRows.map((row) => row.asset_id);

  const [categoriesRes, assetsRes] = await Promise.all([
    categoryIds.length ? supabase.from("categories").select("*").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    assetIds.length ? supabase.from("assets").select("*").in("id", assetIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if ((categoriesRes as any).error || (assetsRes as any).error) {
    throw (categoriesRes as any).error ?? (assetsRes as any).error;
  }

  const categoriesData = ((categoriesRes as { data: CategoryRow[] | null }).data ?? []) as CategoryRow[];
  const assetsData = ((assetsRes as { data: AssetRow[] | null }).data ?? []) as AssetRow[];

  const categories = productCategoryRows
    .map((relation) => categoriesData.find((category) => category.id === relation.category_id))
    .filter(Boolean) as CategoryRow[];
  const assets = productAssetRows
    .map((relation) => {
      const asset = assetsData.find((item) => item.id === relation.asset_id);
      if (!asset) return null;
      return { relation, asset };
    })
    .filter((entry): entry is { relation: ProductAssetRow; asset: AssetRow } => Boolean(entry));

  return mapProduct(product, (variantsRes.data ?? []) as ProductVariantRow[], categories, assets);
}
