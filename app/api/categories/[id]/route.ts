import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { mapCategory } from "@/lib/mappers";
import { ensureAdmin } from "../../products/route";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const adminCheck = await ensureAdmin();
  if ("response" in adminCheck) return adminCheck.response;

  let payload: { name?: string; slug?: string; parentId?: string | null; sortOrder?: number };
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: payload.name,
      slug: payload.slug,
      parent_id: payload.parentId ?? null,
      sort_order: payload.sortOrder ?? 0,
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update category" }, { status: 500 });
  }

  return NextResponse.json(mapCategory(data));
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const adminCheck = await ensureAdmin();
  if ("response" in adminCheck) return adminCheck.response;

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
