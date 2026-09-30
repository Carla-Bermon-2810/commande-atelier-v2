import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabase-server";

type LiaisonPanierRow = {
  catalogue_id: number;
  stock_reference_key: string | null;
  unite_commande: "piece" | "boite" | "tube" | "tige";
  facteur_conversion: number | string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function libelleUnite(unite: LiaisonPanierRow["unite_commande"], facteur: number) {
  if (unite === "boite") return `Boîte de ${formatNumber(facteur)} pièce${facteur > 1 ? "s" : ""}`;
  if (unite === "tube" || unite === "tige") return "Longueur à confirmer à la réception";
  return "Pièce";
}

/**
 * Retourne seulement les libellés utiles à l'opérateur. La référence Stock
 * complète est reconstruite côté serveur lors de l'envoi de la commande.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = [...new Set(
    (url.searchParams.get("catalogueIds") ?? "")
      .split(",")
      .map((value) => Number(value))
      .filter((value) => Number.isSafeInteger(value) && value > 0)
  )].slice(0, 100);

  if (!ids.length) return NextResponse.json({ contextes: {} });

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("catalogue_stock_liaisons")
      .select("catalogue_id,stock_reference_key,unite_commande,facteur_conversion")
      .in("catalogue_id", ids)
      .eq("actif", true)
      .returns<LiaisonPanierRow[]>();

    if (error) throw error;

    const contextes = Object.fromEntries((data ?? []).flatMap((liaison) => {
      const facteur = Number(liaison.facteur_conversion);
      if (!Number.isFinite(facteur) || facteur <= 0) return [];
      return [[liaison.catalogue_id, {
        unite: libelleUnite(liaison.unite_commande, facteur),
        referenceMetier: liaison.stock_reference_key ?? null,
      }]];
    }));

    return NextResponse.json({ contextes });
  } catch (error) {
    console.error("Erreur contexte panier :", error);
    return NextResponse.json({ contextes: {} });
  }
}
