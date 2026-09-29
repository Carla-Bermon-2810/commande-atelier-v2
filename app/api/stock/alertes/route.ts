import { NextResponse } from "next/server";

import { getStockAlertsSnapshot } from "@/lib/stock-alerts-server";
import type { StockAlertReference } from "@/lib/stock-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const snapshot = await getStockAlertsSnapshot();
    const alertes = snapshot.alertes.map((reference) => {
      return {
        ...reference,
        stockUrl: stockUrl(reference),
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
