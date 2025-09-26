import { describe, expect, it } from "vitest";
import { mapProduct, mapVariant } from "../lib/mappers";

const productRow = {
  id: "1",
  sku: "SKU",
  name: "Sample",
  slug: "sample",
  description: "Desc",
  status: "published" as const,
  specs: { color: "red" },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const variantRow = {
  id: "v1",
  product_id: "1",
  sku: "SKU-V1",
  title: "Variant",
  attributes: { size: "M" },
  price_cents: 1000,
  currency: "NOK",
  stock_on_hand: 5,
  is_default: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("mappers", () => {
  it("maps variant to DTO", () => {
    const variant = mapVariant(variantRow);
    expect(variant).toEqual({
      id: "v1",
      sku: "SKU-V1",
      title: "Variant",
      attributes: { size: "M" },
      price: { amountCents: 1000, currency: "NOK" },
      stockOnHand: 5,
      isDefault: true,
    });
  });

  it("maps product with relations", () => {
    const product = mapProduct(
      productRow,
      [variantRow],
      [
        {
          id: "c1",
          name: "Category",
          slug: "category",
          parent_id: null,
          path: null,
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
      [
        {
          asset: {
            id: "a1",
            url: "https://example.com/image.jpg",
            alt: "Alt",
            width: null,
            height: null,
            mime_type: null,
            created_at: new Date().toISOString(),
          },
          relation: {
            product_id: "1",
            asset_id: "a1",
            role: "primary" as const,
            sort_order: 0,
          },
        },
      ]
    );

    expect(product.images[0]).toEqual({ url: "https://example.com/image.jpg", alt: "Alt" });
    expect(product.categories[0]).toMatchObject({ name: "Category" });
    expect(product.variants).toHaveLength(1);
  });
});
