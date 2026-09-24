import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/admin-auth";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const tables = new Set(["catalogue", "categories", "famille"]);
const operations = new Set(["select", "insert", "update", "delete"]);
const filterColumns = new Set(["id", "categorie", "famille", "slug"]);

type RequestBody = { table?: unknown; operation?: unknown; values?: unknown; filters?: unknown; order?: unknown };
type Filter = { column: string; value: string | number | boolean | null };

function validFilters(value: unknown): value is Filter[] {
  return Array.isArray(value) && value.length <= 5 && value.every((filter) => {
    if (!filter || typeof filter !== "object") return false;
    const candidate = filter as { column?: unknown; value?: unknown };
    return typeof candidate.column === "string" && filterColumns.has(candidate.column) &&
      (["string", "number", "boolean"].includes(typeof candidate.value) || candidate.value === null);
  });
}

export async function POST(request: NextRequest) {
  if (!await hasAdminAccess()) return NextResponse.json({ message: "Accès administrateur requis." }, { status: 401 });
  const body = await request.json().catch(() => null) as RequestBody | null;
  if (!body || typeof body.table !== "string" || !tables.has(body.table) || typeof body.operation !== "string" || !operations.has(body.operation) || !validFilters(body.filters ?? [])) {
    return NextResponse.json({ message: "Demande d'administration invalide." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    const filters = (body.filters ?? []) as Filter[];
    if (body.operation === "select") {
      let query = supabase.from(body.table).select("*");
      for (const filter of filters) query = query.eq(filter.column, filter.value);
      if (typeof body.order === "string" && ["nom", "ordre", "categorie", "famille", "produit", "id"].includes(body.order)) query = query.order(body.order);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ data });
    }
    if (!body.values || typeof body.values !== "object") return NextResponse.json({ message: "Valeurs manquantes." }, { status: 400 });
    if (body.operation === "insert") {
      const { data, error } = await supabase.from(body.table).insert(body.values).select();
      if (error) throw error;
      return NextResponse.json({ data });
    }
    if (filters.length === 0) return NextResponse.json({ message: "Filtre obligatoire." }, { status: 400 });
    let query = body.operation === "update" ? supabase.from(body.table).update(body.values) : supabase.from(body.table).delete();
    for (const filter of filters) query = query.eq(filter.column, filter.value);
    const { data, error } = await query.select();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Erreur API administration:", error);
    return NextResponse.json({ message: "Opération d'administration impossible." }, { status: 500 });
  }
}
