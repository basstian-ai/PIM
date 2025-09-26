import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../app/api/products/route";

const mockProducts = [
  {
    id: "1",
    sku: "SKU-1",
    name: "Product 1",
    slug: "product-1",
    description: null,
    status: "published" as const,
    specs: {},
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

const mockVariants = [
  {
    id: "v1",
    product_id: "1",
    sku: "SKU-1",
    title: null,
    attributes: {},
    price_cents: 1999,
    currency: "NOK",
    stock_on_hand: 3,
    is_default: true,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

const mockCategoryRelations: any[] = [];
const mockAssetRelations: any[] = [];

vi.mock("@/lib/auth", () => ({
  getSessionUser: vi.fn().mockResolvedValue(null),
}));

const productQueryResult = {
  data: mockProducts,
  count: 1,
  error: null,
};

const variantsResult = { data: mockVariants, error: null };
const categoryResult = { data: [], error: null };
const assetResult = { data: [], error: null };
const productCategoriesResult = { data: mockCategoryRelations, error: null };
const productAssetsResult = { data: mockAssetRelations, error: null };

const client = {
  from: vi.fn((table: string) => {
    switch (table) {
      case "products": {
        const chain: any = {
          select: vi.fn().mockImplementation(() => chain),
          order: vi.fn().mockImplementation(() => chain),
          range: vi.fn().mockImplementation(() => chain),
          or: vi.fn().mockImplementation(() => chain),
          eq: vi.fn().mockImplementation(() => chain),
          in: vi.fn().mockImplementation(() => chain),
          then: (resolve: (value: typeof productQueryResult) => void) => {
            resolve(productQueryResult);
          },
        };
        return chain;
      }
      case "product_variants":
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue(Promise.resolve(variantsResult)),
        };
      case "product_categories":
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue(Promise.resolve(productCategoriesResult)),
          eq: vi.fn().mockReturnValue(Promise.resolve(productCategoriesResult)),
        };
      case "product_assets":
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue(Promise.resolve(productAssetsResult)),
          eq: vi.fn().mockReturnValue(Promise.resolve(productAssetsResult)),
        };
      case "categories":
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue(Promise.resolve(categoryResult)),
        };
      case "assets":
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnValue(Promise.resolve(assetResult)),
        };
      default:
        throw new Error(`Unexpected table ${table}`);
    }
  }),
};

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: () => client,
}));

function createRequest(url: string) {
  return new Request(url, { method: "GET" });
}

describe("GET /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated products", async () => {
    const response = await GET(createRequest("http://localhost:3000/api/products?page=1&pageSize=10"));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ page: 1, pageSize: 10, total: 1 });
    expect(payload.items[0]).toMatchObject({ id: "1", name: "Product 1" });
  });

  it("filters by sku", async () => {
    const response = await GET(createRequest("http://localhost:3000/api/products?sku=SKU-1"));
    await response.json();
    const productsCall = client.from.mock.results.find((result) => result.value && result.value.select);
    expect(productsCall?.value.eq).toHaveBeenCalledWith("sku", "SKU-1");
  });
});
