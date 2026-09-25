import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

const sources = new Set(["tubes", "tiges_filetees"]);
type Source = "tubes" | "tiges_filetees";

function isSource(value: unknown): value is Source {
  return typeof value === "string" && sources.has(value);
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source");
  if (!isSource(source)) {
    return NextResponse.json({ message: "Source de seuil invalide." }, { status: 400 });
  }

  try {
    const { data, error } = await getServerSupabase()
      .from("stock_seuils_longueur")
      .select("source,reference_key,seuil_mm")
      .eq("source", source);
    if (error) throw error;
    return NextResponse.json({ seuils: data ?? [] });
  } catch (error) {
    console.error("Erreur lecture seuils longueur :", error);
    return NextResponse.json({ message: "Impossible de charger les seuils de longueur." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    source?: unknown;
    referenceKey?: unknown;
    seuilMm?: unknown;
  } | null;

  if (!body || !isSource(body.source) || typeof body.referenceKey !== "string" || !body.referenceKey.trim() || body.referenceKey.length > 500) {
    return NextResponse.json({ message: "Seuil de longueur invalide." }, { status: 400 });
  }

  const referenceKey = body.referenceKey.trim();
  const seuilMm = body.seuilMm;
  if (seuilMm !== null && (!Number.isInteger(seuilMm) || (seuilMm as number) < 0 || (seuilMm as number) > 10_000_000)) {
    return NextResponse.json({ message: "Le seuil doit être un nombre entier positif en millimètres." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    if (seuilMm === null) {
      const { error } = await supabase
        .from("stock_seuils_longueur")
        .delete()
        .eq("source", body.source)
        .eq("reference_key", referenceKey);
      if (error) throw error;
      return NextResponse.json({ seuil: null });
    }

    const { data, error } = await supabase
      .from("stock_seuils_longueur")
      .upsert({
        source: body.source,
        reference_key: referenceKey,
        seuil_mm: seuilMm,
        updated_at: new Date().toISOString(),
      }, { onConflict: "source,reference_key" })
      .select("source,reference_key,seuil_mm")
      .single();
    if (error) throw error;
    return NextResponse.json({ seuil: data });
  } catch (error) {
    console.error("Erreur enregistrement seuil longueur :", error);
    return NextResponse.json({ message: "Impossible d’enregistrer le seuil de longueur." }, { status: 500 });
  }
}
