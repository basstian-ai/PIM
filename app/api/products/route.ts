import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSessionUser } from "@/lib/auth";
import { ensureAdmin } from "@/lib/admin";
import type { Database } from "@/lib/types.generated";
import type { ProductInput } from "@/lib/types";
import { mapProduct } from "@/lib/mappers";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ProductCategoryRow = Database["public"]["Tables"]["product_categories"]["Row"];
type ProductAssetRow = Database["public"]["Tables"]["product_assets"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type AssetRow = Database["public"]["Tables"]["assets"]["Row"];

function allowCors(request: NextRequest, response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return allowCors(request, NextResponse.json({}));
}

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient() as any;
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") ?? "20", 10) || 20, 1),
    100
  );
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const sku = searchParams.get("sku");
  const includeDrafts = searchParams.get("includeDrafts") === "true";

  const sessionUser = await getSessionUser();
  const canViewDrafts = sessionUser && ["admin", "editor"].includes(sessionUser.role);

  let allowedStatus: string | null = null;
  if (!includeDrafts || !canViewDrafts) {
    allowedStatus = "published";
  }

  let categoryProductIds: string[] | undefined;
  if (categoryId) {
    const { data: productCategoryRows, error } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", categoryId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const categoryRows = (productCategoryRows ?? []) as Array<Pick<ProductCategoryRow, "product_id">>;
    categoryProductIds = categoryRows.map((row) => row.product_id);
    if (categoryProductIds.length === 0) {
      const emptyResponse = NextResponse.json({ page, pageSize, total: 0, items: [] });
      return allowCors(request, emptyResponse);
    }
  }

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (allowedStatus) {
    query = query.eq("status", allowedStatus);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (sku) {
    query = query.eq("sku", sku);
  }
  if (categoryProductIds) {
    query = query.in("id", categoryProductIds);
  }

  const { data: products, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const productRows = (products ?? []) as ProductRow[];
  const productIds = productRows.map((product) => product.id);
  if (productIds.length === 0) {
    const emptyResponse = NextResponse.json({ page, pageSize, total: 0, items: [] });
    return allowCors(request, emptyResponse);
  }

  const [variantsRes, productCategoriesRes, productAssetsRes] = await Promise.all([
    supabase.from("product_variants").select("*").in("product_id", productIds),
    supabase.from("product_categories").select("product_id, category_id").in("product_id", productIds),
    supabase.from("product_assets").select("product_id, asset_id, role, sort_order").in("product_id", productIds),
  ]);

  if (variantsRes.error || productCategoriesRes.error || productAssetsRes.error) {
    return NextResponse.json(
      {
        error:
          variantsRes.error?.message ||
          productCategoriesRes.error?.message ||
          productAssetsRes.error?.message,
      },
      { status: 500 }
    );
  }

  const variantRows = (variantsRes.data ?? []) as ProductVariantRow[];
  const categoryRelations = (productCategoriesRes.data ?? []) as ProductCategoryRow[];
  const assetRelations = (productAssetsRes.data ?? []) as ProductAssetRow[];

  const categoryIds = Array.from(new Set(categoryRelations.map((row) => row.category_id)));
  const assetIds = Array.from(new Set(assetRelations.map((row) => row.asset_id)));

  const [categoriesRes, assetsRes] = await Promise.all([
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null } as const),
    assetIds.length
      ? supabase.from("assets").select("*").in("id", assetIds)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if ((categoriesRes as any).error || (assetsRes as any).error) {
    const errorMessage =
      (categoriesRes as any).error?.message ?? (assetsRes as any).error?.message ?? "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  const categoriesData = ((categoriesRes as { data: CategoryRow[] | null }).data ?? []) as CategoryRow[];
  const assetsData = ((assetsRes as { data: AssetRow[] | null }).data ?? []) as AssetRow[];

  const categoriesById = new Map(categoriesData.map((category) => [category.id, category] as const));
  const assetsById = new Map(assetsData.map((asset) => [asset.id, asset] as const));

  const variantsByProduct = new Map<string, ProductVariantRow[]>();
  for (const variant of variantRows) {
    const arr = variantsByProduct.get(variant.product_id) ?? [];
    arr.push(variant);
    variantsByProduct.set(variant.product_id, arr);
  }

  const categoriesByProduct = new Map<string, CategoryRow[]>();
  for (const row of categoryRelations) {
    const arr = categoriesByProduct.get(row.product_id) ?? [];
    const category = categoriesById.get(row.category_id);
    if (category) arr.push(category);
    categoriesByProduct.set(row.product_id, arr);
  }

  const assetsByProduct = new Map<string, Array<{ asset: AssetRow; relation: ProductAssetRow }>>();
  for (const row of assetRelations) {
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

  const response = NextResponse.json({
    page,
    pageSize,
    total: count ?? items.length,
    items,
  });
  return allowCors(request, response);
}

export async function POST(request: NextRequest) {
  const adminCheck = await ensureAdmin();
  if ("response" in adminCheck) return adminCheck.response;

  let payload: ProductInput;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload?.variants?.length) {
    return NextResponse.json({ error: "At least one variant is required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient() as any;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      sku: payload.sku,
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
      status: payload.status,
      specs: payload.specs ?? {},
    })
    .select("*")
    .single();

  if (error || !product) {
    return NextResponse.json({ error: error?.message ?? "Failed to create product" }, { status: 500 });
  }

  if (payload.categoryIds?.length) {
    const inserts = payload.categoryIds.map((categoryId) => ({
      product_id: product.id,
      category_id: categoryId,
    }));
    const { error: categoryError } = await supabase
      .from("product_categories")
      .insert(inserts as never);
    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }
  }

  const variantInserts = payload.variants.map((variant, index) => ({
    product_id: product.id,
    sku: variant.sku ?? null,
    title: variant.title ?? null,
    attributes: (variant.attributes ?? {}) as ProductVariantRow["attributes"],
    price_cents: variant.price.amountCents,
    currency: variant.price.currency,
    stock_on_hand: variant.stockOnHand,
    is_default: variant.isDefault ?? index === 0,
  }));

  const { error: variantsError } = await supabase
    .from("product_variants")
    .insert(variantInserts as never);
  if (variantsError) {
    return NextResponse.json({ error: variantsError.message }, { status: 500 });
  }

  if (payload.images?.length) {
    const assetInserts = payload.images.map((image) => ({
      url: image.url,
      alt: image.alt ?? null,
    }));
    const { data: insertedAssets, error: assetError } = await supabase
      .from("assets")
      .insert(assetInserts as never)
      .select("id");

    if (assetError) {
      return NextResponse.json({ error: assetError.message }, { status: 500 });
    }

    const insertedAssetRows = (insertedAssets ?? []) as Pick<AssetRow, "id">[];
    const productAssetInserts = insertedAssetRows.map((asset, index) => ({
      product_id: product.id,
      asset_id: asset.id,
      role: index === 0 ? "primary" : "gallery",
      sort_order: index,
    }));
    const { error: productAssetError } = await supabase
      .from("product_assets")
      .insert(productAssetInserts as never);
    if (productAssetError) {
      return NextResponse.json({ error: productAssetError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: product.id }, { status: 201 });
}
