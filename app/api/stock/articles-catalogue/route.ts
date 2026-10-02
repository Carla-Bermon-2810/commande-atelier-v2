import { NextRequest, NextResponse } from "next/server";

import { getStockArticlesCatalogue, type StockCatalogueType } from "@/lib/stock-articles-catalogue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isType(value: string | null): value is StockCatalogueType {
  return value === "abrasifs" || value === "soudure" || value === "epi" || value === "consommables";
}

export async function GET(request: NextRequest) {
  const rawType = request.nextUrl.searchParams.get("type");
  if (rawType !== null && !isType(rawType)) {
    return NextResponse.json({ message: "Famille Stock invalide." }, { status: 400 });
  }
  try {
    const articles = await getStockArticlesCatalogue(rawType ?? undefined);
    return NextResponse.json({ articles }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Impossible de charger les références." }, { status: 500 });
  }
}
