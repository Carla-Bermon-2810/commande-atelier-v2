import { NextRequest, NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function amount(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1_000_000_000 ? parsed : null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const articleId = Number(body?.articleId);
  const uniteLibelle = text(body?.uniteLibelle, 80);
  const conditionnementLabel = text(body?.conditionnementLabel, 120);
  const quantiteDisponible = amount(body?.quantiteDisponible);
  const seuilMinimum = amount(body?.seuilMinimum);
  const facteurConversion = amount(body?.facteurConversion ?? 1);

  if (!Number.isSafeInteger(articleId) || articleId <= 0 || !uniteLibelle || quantiteDisponible === null || seuilMinimum === null || facteurConversion === null || facteurConversion <= 0) {
    return NextResponse.json({ message: "Les informations d’initialisation sont incomplètes ou invalides." }, { status: 400 });
  }

  try {
    const { data, error } = await getServerSupabase().rpc("initialiser_stock_article_catalogue", {
      p_article_id: articleId,
      p_unite_libelle: uniteLibelle,
      p_conditionnement_label: conditionnementLabel || null,
      p_quantite_disponible: quantiteDisponible,
      p_seuil_minimum: seuilMinimum,
      p_facteur_conversion: facteurConversion,
    });
    if (error) throw error;
    return NextResponse.json({ result: data });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Impossible d’initialiser la référence." }, { status: 500 });
  }
}
