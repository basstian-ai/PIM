import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { mapCategory } from "@/lib/mappers";
import { ensureAdmin } from "../products/route";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories = (data ?? []).map(mapCategory);
  const response = NextResponse.json(categories);
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}

export async function POST(request: Request) {
  const adminCheck = await ensureAdmin();
  if ("response" in adminCheck) return adminCheck.response;

  let payload: { name?: string; slug?: string; parentId?: string | null; sortOrder?: number };
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.name || !payload.slug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: payload.name,
      slug: payload.slug,
      parent_id: payload.parentId ?? null,
      sort_order: payload.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create category" }, { status: 500 });
  }

  return NextResponse.json(mapCategory(data), { status: 201 });
}
