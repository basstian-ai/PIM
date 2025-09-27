import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSessionUser } from "@/lib/auth";
import type { Database } from "@/lib/types.generated";
import type { ProductInput } from "@/lib/types";
import { mapProduct } from "@/lib/mappers";
import { ensureAdmin } from "@/lib/admin";

type ProductCategoryRow = Database["public"]["Tables"]["product_categories"]["Row"];
type ProductAssetRow = Database["public"]["Tables"]["product_assets"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type AssetRow = Database["public"]["Tables"]["assets"]["Row"];

async function fetchProduct(
  productIdOrSlug: string,
  options: { includeDrafts?: boolean } = {}
) {
  const supabase = createSupabaseServerClient() as any;

  let query = supabase.from("products").select("*").limit(1);
  if (!options.includeDrafts) {
    query = query.eq("status", "published");
  }
  const isUuid = /^[0-9a-fA-F-]{36}$/.test(productIdOrSlug);
  const { data: products, error } = isUuid
    ? await query.eq("id", productIdOrSlug)
    : await query.eq("slug", productIdOrSlug);
  if (error || !products?.[0]) {
    return { error, product: null } as const;
  }
  const product = products[0];
  const productId = product.id;

  const [variantsRes, productCategoriesRes, productAssetsRes] = await Promise.all([
    supabase.from("product_variants").select("*").eq("product_id", productId),
    supabase.from("product_categories").select("product_id, category_id").eq("product_id", productId),
    supabase.from("product_assets").select("product_id, asset_id, role, sort_order").eq("product_id", productId),
  ]);

  if (variantsRes.error || productCategoriesRes.error || productAssetsRes.error) {
    return { error: variantsRes.error ?? productCategoriesRes.error ?? productAssetsRes.error, product: null } as const;
  }

  const productCategoryRows = (productCategoriesRes.data ?? []) as ProductCategoryRow[];
  const productAssetRows = (productAssetsRes.data ?? []) as ProductAssetRow[];

  const categoryIds = productCategoryRows.map((row) => row.category_id);
  const assetIds = productAssetRows.map((row) => row.asset_id);

  const [categoriesRes, assetsRes] = await Promise.all([
    categoryIds.length
      ? supabase.from("categories").select("*").in("id", categoryIds)
      : Promise.resolve({ data: [], error: null } as const),
    assetIds.length
      ? supabase.from("assets").select("*").in("id", assetIds)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if ((categoriesRes as any).error || (assetsRes as any).error) {
    return {
      error: (categoriesRes as any).error ?? (assetsRes as any).error,
      product: null,
    } as const;
  }

  const categories = productCategoryRows
    .map((relation) => (categoriesRes as any).data.find((cat: any) => cat.id === relation.category_id))
    .filter(Boolean);
  const assets = productAssetRows.map((relation) => ({
    relation,
    asset: (assetsRes as any).data.find((asset: any) => asset.id === relation.asset_id),
  }));

  const mapped = mapProduct(product, variantsRes.data ?? [], categories ?? [], assets ?? []);
  return { product: mapped, error: null } as const;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionUser = await getSessionUser();
  const canViewDrafts = sessionUser && ["admin", "editor"].includes(sessionUser.role);

  const { product, error } = await fetchProduct(params.id, {
    includeDrafts: Boolean(canViewDrafts),
  });
  if (error || !product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json(product);
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminCheck = await ensureAdmin();
  if ("response" in adminCheck) return adminCheck.response;

  let payload: ProductInput;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient() as any;

  const updates: ProductUpdate = {
    sku: payload.sku,
    name: payload.name,
    slug: payload.slug,
    description: payload.description ?? null,
    status: payload.status,
    specs: (payload.specs ?? {}) as ProductUpdate["specs"],
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("products")
    .update(updates as never)
    .eq("id", params.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("product_categories").delete().eq("product_id", params.id);
  if (payload.categoryIds?.length) {
    const categoryRows = payload.categoryIds.map((categoryId) => ({
      product_id: params.id,
      category_id: categoryId,
    }));
    const { error: categoryError } = await supabase.from("product_categories").insert(categoryRows);
    if (categoryError) {
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }
  }

  await supabase.from("product_variants").delete().eq("product_id", params.id);
  if (payload.variants?.length) {
    const variantRows = payload.variants.map((variant, index) => ({
      ...(variant.id ? { id: variant.id } : {}),
      product_id: params.id,
      sku: variant.sku ?? null,
      title: variant.title ?? null,
      attributes: variant.attributes ?? {},
      price_cents: variant.price.amountCents,
      currency: variant.price.currency,
      stock_on_hand: variant.stockOnHand,
      is_default: variant.isDefault ?? index === 0,
    }));
    const { error: variantsError } = await supabase.from("product_variants").insert(variantRows);
    if (variantsError) {
      return NextResponse.json({ error: variantsError.message }, { status: 500 });
    }
  }

  await supabase.from("product_assets").delete().eq("product_id", params.id);
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
    const productAssetRows = (insertedAssets ?? []) as Pick<AssetRow, "id">[];
    const productAssetInserts = productAssetRows.map((asset, index) => ({
      product_id: params.id,
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

  const { product, error } = await fetchProduct(params.id, { includeDrafts: true });
  if (error || !product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}
