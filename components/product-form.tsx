"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Category, Image as ImageDto, Product, ProductInput, Variant } from "@/lib/types";
import { useSupabase } from "@/components/supabase-provider";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function emptyVariant(): Variant {
  return {
    id: createId(),
    sku: "",
    title: "",
    attributes: {},
    price: { amountCents: 0, currency: "NOK" },
    stockOnHand: 0,
    isDefault: false,
  };
}

type ProductFormProps = {
  product?: Product;
};

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const supabase = useSupabase();
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<ProductInput["status"]>(product?.status ?? "draft");
  const [specs, setSpecs] = useState(JSON.stringify(product?.specs ?? {}, null, 2));
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? [emptyVariant()]);
  const [images, setImages] = useState<ImageDto[]>(product?.images ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product?.categories.map((category) => category.id) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      const response = await fetch("/api/categories", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as Category[];
      setCategories(data);
    }
    loadCategories();
  }, []);

  const defaultVariantIndex = useMemo(() => variants.findIndex((variant) => variant.isDefault), [variants]);

  function setVariant(index: number, next: Partial<Variant>) {
    setVariants((current) => {
      const copy = [...current];
      copy[index] = { ...copy[index], ...next };
      return copy;
    });
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const filename = `${createId()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("product-media").upload(filename, file, {
      upsert: true,
    });
    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }
    const { data } = supabase.storage.from("product-media").getPublicUrl(filename);
    setImages((prev) => [...prev, { url: data.publicUrl }]);
    setLoading(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    let parsedSpecs: Record<string, unknown> = {};
    try {
      parsedSpecs = specs ? JSON.parse(specs) : {};
    } catch (parseError) {
      setError("Specs must be valid JSON");
      setLoading(false);
      return;
    }

    const payload: ProductInput = {
      name,
      sku,
      slug,
      description,
      status,
      specs: parsedSpecs,
      categoryIds: selectedCategories,
      images,
      variants: variants.map((variant, index) => ({
        id: product ? variant.id : undefined,
        sku: variant.sku ?? undefined,
        title: variant.title ?? undefined,
        attributes: variant.attributes ?? {},
        price: variant.price,
        stockOnHand: variant.stockOnHand,
        isDefault: index === defaultVariantIndex || (defaultVariantIndex === -1 && index === 0),
      })),
    };

    const response = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to save product");
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="sku">SKU</label>
          <input id="sku" value={sku} onChange={(event) => setSku(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug">Slug</label>
          <input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(event) => setStatus(event.target.value as ProductInput["status"])}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={4}
          value={description ?? ""}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="specs">Specifications JSON</label>
        <textarea id="specs" rows={6} value={specs} onChange={(event) => setSpecs(event.target.value)} />
      </div>
      <div className="space-y-2">
        <label>Categories</label>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const checked = selectedCategories.includes(category.id);
            return (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedCategories((current) =>
                      checked ? current.filter((id) => id !== category.id) : [...current, category.id]
                    );
                  }}
                />
                {category.name}
              </label>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Variants</h2>
          <button
            type="button"
            onClick={() => setVariants((current) => [...current, emptyVariant()])}
            className="rounded border border-blue-600 bg-white px-3 py-1 text-sm text-blue-600"
          >
            Add variant
          </button>
        </div>
        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={variant.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Variant {index + 1}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="defaultVariant"
                      checked={index === defaultVariantIndex}
                      onChange={() =>
                        setVariants((current) =>
                          current.map((entry, entryIndex) => ({ ...entry, isDefault: entryIndex === index }))
                        )
                      }
                    />
                    Default
                  </label>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() => removeVariant(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label>SKU</label>
                  <input value={variant.sku ?? ""} onChange={(event) => setVariant(index, { sku: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <label>Title</label>
                  <input value={variant.title ?? ""} onChange={(event) => setVariant(index, { title: event.target.value })} />
                </div>
                <div className="space-y-1">
                  <label>Attributes JSON</label>
                  <textarea
                    rows={4}
                    value={JSON.stringify(variant.attributes ?? {}, null, 2)}
                    onChange={(event) => {
                      try {
                        const value = JSON.parse(event.target.value || "{}");
                        setVariant(index, { attributes: value });
                        setError(null);
                      } catch (parseError) {
                        setError("Variant attributes must be valid JSON");
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label>Price (cents)</label>
                  <input
                    type="number"
                    value={variant.price.amountCents}
                    onChange={(event) =>
                      setVariant(index, {
                        price: { ...variant.price, amountCents: Number(event.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label>Currency</label>
                  <input
                    value={variant.price.currency}
                    onChange={(event) =>
                      setVariant(index, { price: { ...variant.price, currency: event.target.value.toUpperCase() } })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label>Stock on hand</label>
                  <input
                    type="number"
                    value={variant.stockOnHand}
                    onChange={(event) => setVariant(index, { stockOnHand: Number(event.target.value) })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label>Images</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <div className="flex flex-wrap gap-4">
          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="w-32">
              <Image
                src={image.url}
                alt={image.alt ?? ""}
                width={128}
                height={128}
                className="h-24 w-full rounded object-cover"
                unoptimized
              />
              <input
                className="mt-1"
                placeholder="Alt text"
                value={image.alt ?? ""}
                onChange={(event) =>
                  setImages((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? { ...entry, alt: event.target.value } : entry
                    )
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2">
        {loading ? "Saving..." : product ? "Update product" : "Create product"}
      </button>
    </form>
  );
}
