import { NextResponse } from "next/server";

import { getStockAlertsSnapshot } from "@/lib/stock-alerts-server";
import { getServerSupabase } from "@/lib/supabase-server";
import type { StockAlertReference } from "@/lib/stock-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CatalogueRow = {
  id: number;
  categorie: string;
  famille: string;
  produit: string;
  dimension: string | null;
  grain: string | null;
  photo: string | null;
};

function normalise(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR").replace(/\s+/g, " ");
}

function stockUrl(reference: StockAlertReference) {
  const routes: Record<StockAlertReference["source"], string> = {
    tubes: `/stock/tubes/${reference.famille.toLocaleLowerCase("fr-FR") === "aluminium" ? "alu" : reference.famille.toLocaleLowerCase("fr-FR")}`,
    tiges_filetees: "/stock/tiges-filetees",
    vis: "/stock/fixations/vis",
    ecrous: "/stock/fixations/ecrous",
    inserts: "/stock/fixations/inserts",
    rivets: "/stock/fixations/rivets",
    forets: "/stock/outillage/forets",
    fraises: "/stock/outillage/fraises",
    tarauds: "/stock/outillage/tarauds",
  };
  return routes[reference.source];
}

/**
 * Une liaison panier n'est créée que pour une désignation catalogue strictement
 * identique. Cela évite qu'une référence de stock soit commandée à la place
 * d'un autre article à cause d'un rapprochement approximatif.
 */
export async function GET() {
  try {
    const [snapshot, catalogueResult] = await Promise.all([
      getStockAlertsSnapshot(),
      getServerSupabase().from("catalogue").select("id,categorie,famille,produit,dimension,grain,photo"),
    ]);

    if (catalogueResult.error) {
      throw new Error(`Impossible de charger le catalogue : ${catalogueResult.error.message}`);
    }

    const catalogueParDesignation = new Map<string, CatalogueRow>();
    for (const row of (catalogueResult.data ?? []) as CatalogueRow[]) {
      const key = normalise(row.produit);
      if (key && !catalogueParDesignation.has(key)) catalogueParDesignation.set(key, row);
    }

    const supabase = getServerSupabase();
    const alertes = snapshot.alertes.map((reference) => {
      const article = catalogueParDesignation.get(normalise(reference.libelle));
      const photo = article?.photo
        ? supabase.storage.from("photos").getPublicUrl(article.photo).data.publicUrl
        : undefined;
      const variante = article
        ? [article.dimension, article.grain].filter(Boolean).join(" • ") || undefined
        : undefined;

      return {
        ...reference,
        stockUrl: stockUrl(reference),
        panier: article
          ? {
              catalogueId: article.id,
              article: variante ? `${article.produit} — ${variante}` : article.produit,
              famille: article.famille,
              variante,
              photo,
            }
          : null,
      };
    });

    return NextResponse.json({
      alertes,
      global: snapshot.global,
      indicateurs: {
        referencesSuivies: snapshot.global.nombreReferences,
        alertes: snapshot.global.nombreAlertes,
        ruptures: snapshot.alertes.filter((reference) => reference.statut === "rupture").length,
        seuilsNonDefinis: snapshot.references.filter((reference) => reference.statut === "non_defini").length,
      },
      parCategorie: Object.fromEntries(snapshot.parCategorie),
      parFamille: Object.fromEntries(snapshot.parFamille),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible de charger les alertes stock." },
      { status: 500 },
    );
  }
}
