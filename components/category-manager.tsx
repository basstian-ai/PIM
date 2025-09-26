"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadCategories() {
    const response = await fetch("/api/categories", { cache: "no-store" });
    if (!response.ok) {
      setMessage("Failed to load categories");
      return;
    }
    const data = (await response.json()) as Category[];
    setCategories(data);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, slug }),
    });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error ?? "Failed to create category");
      return;
    }
    setName("");
    setSlug("");
    await loadCategories();
  }

  async function updateCategory(category: Category, changes: Partial<Category>) {
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...category, ...changes }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error ?? "Failed to update category");
      return;
    }
    await loadCategories();
  }

  async function deleteCategory(category: Category) {
    if (!confirm(`Delete ${category.name}?`)) return;
    const response = await fetch(`/api/categories/${category.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error ?? "Failed to delete category");
      return;
    }
    await loadCategories();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createCategory} className="flex flex-col gap-3 md:flex-row">
        <input
          placeholder="Category name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input placeholder="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        <button type="submit" disabled={loading} className="px-4">
          {loading ? "Saving..." : "Add"}
        </button>
      </form>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <div className="rounded border border-slate-200 bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-slate-100 text-left text-sm font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t text-sm">
                <td className="px-4 py-2">
                  <input
                    value={category.name}
                    onChange={(event) => updateCategory(category, { name: event.target.value })}
                    className="w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={category.slug}
                    onChange={(event) => updateCategory(category, { slug: event.target.value })}
                    className="w-full"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button type="button" className="text-red-600" onClick={() => deleteCategory(category)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
