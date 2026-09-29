import { getServerSupabase } from "@/lib/supabase-server";
import { buildTigeReferenceKey, buildTubeReferenceKey, type StockAlertSource } from "@/lib/stock-alerts";

export const STOCK_LINK_SOURCES = [
  "tubes",
  "tiges_filetees",
  "vis",
  "ecrous",
  "inserts",
  "rivets",
  "forets",
  "fraises",
  "tarauds",
] as const satisfies readonly StockAlertSource[];

export type StockLinkSource = (typeof STOCK_LINK_SOURCES)[number];
export type CommandUnit = "piece" | "boite" | "tube" | "tige";
export type StockUnit = "pieces" | "mm";

export type StockLinkTarget = {
  id: string;
  stockType: StockLinkSource;
  referenceId: number | null;
  referenceKey: string | null;
  famille: string;
  label: string;
  reference: string;
  caracteristiques: string[];
  uniteStock: StockUnit;
  conversionSuggeree: number;
};

export type CatalogueStockLink = {
  id: string;
  catalogue_id: number;
  stock_type: StockLinkSource;
  stock_reference_id: number | null;
  stock_reference_key: string | null;
  unite_commande: CommandUnit;
  unite_stock: StockUnit;
  facteur_conversion: number;
  libelle_cible: string;
  actif: boolean;
  configuration: Record<string, unknown>;
};

export type CatalogueStockLinkArticle = {
  id: number;
  produit: string;
  categorie: string | null;
  famille: string | null;
  grain: string | null;
  dimension: string | null;
  photo: string | null;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function targetId(source: StockLinkSource, referenceId?: number | null, referenceKey?: string | null) {
  return `${source}:${referenceId ?? referenceKey ?? ""}`;
}

function boxedTarget(source: "vis" | "ecrous" | "rivets", family: string, row: Record<string, unknown>): StockLinkTarget {
  const referenceId = Number(row.id);
  const reference = clean(row.reference) || `#${referenceId}`;
  const designation = clean(row.designation);
  const piecesParBoite = Number(row.pieces_par_boite ?? 0);
  const label = designation || reference;
  return {
    id: targetId(source, referenceId), stockType: source, referenceId, referenceKey: null,
    famille: family, label, reference,
    caracteristiques: [clean(row.matiere) && `Matière : ${clean(row.matiere)}`, clean(row.dimension) && `Dimension : ${clean(row.dimension)}`, piecesParBoite > 0 && `Conditionnement : ${piecesParBoite} pièces / boîte`].filter(Boolean) as string[],
    uniteStock: "pieces", conversionSuggeree: piecesParBoite > 0 ? piecesParBoite : 1,
  };
}

function quantityTarget(source: "inserts" | "forets" | "fraises" | "tarauds", family: string, row: Record<string, unknown>): StockLinkTarget {
  const referenceId = Number(row.id);
  const reference = clean(row.reference) || clean(row.dimension) || `#${referenceId}`;
  const label = clean(row.designation) || `${family} ${reference}`;
  return {
    id: targetId(source, referenceId), stockType: source, referenceId, referenceKey: null,
    famille: family, label, reference,
    caracteristiques: [clean(row.matiere) && `Matière : ${clean(row.matiere)}`, clean(row.dimension) && `Dimension : ${clean(row.dimension)}`].filter(Boolean) as string[],
    uniteStock: "pieces", conversionSuggeree: 1,
  };
}

export async function getCatalogueStockLinkData() {
  const supabase = getServerSupabase();
  const [
    catalogueResult, linksResult, tubesResult, tigesResult, visResult, ecrousResult,
    insertsResult, rivetsResult, foretsResult, fraisesResult, taraudsResult,
  ] = await Promise.all([
    supabase.from("catalogue").select("id,produit,categorie,famille,grain,dimension,photo").order("produit"),
    supabase.from("catalogue_stock_liaisons").select("id,catalogue_id,stock_type,stock_reference_id,stock_reference_key,unite_commande,unite_stock,facteur_conversion,libelle_cible,actif,configuration").order("created_at", { ascending: false }),
    supabase.from("stock_tubes").select("id,matiere,type,section,epaisseur,nuance,statut"),
    supabase.from("stock_tiges_filetees").select("id,matiere,diametre,statut"),
    supabase.from("stock_vis").select("id,reference,designation,matiere,dimension,pieces_par_boite"),
    supabase.from("stock_ecrous").select("id,reference,designation,matiere,dimension,pieces_par_boite"),
    supabase.from("stock_inserts").select("id,reference,designation,matiere,dimension"),
    supabase.from("stock_rivets").select("id,reference,designation,matiere,dimension,pieces_par_boite"),
    supabase.from("stock_forets").select("id,dimension,quantite,seuil_minimum"),
    supabase.from("stock_fraises").select("id,designation,dimension,quantite,seuil_minimum"),
    supabase.from("stock_tarauds").select("id,reference,dimension,quantite,seuil_minimum"),
  ]);

  const results = [catalogueResult, linksResult, tubesResult, tigesResult, visResult, ecrousResult, insertsResult, rivetsResult, foretsResult, fraisesResult, taraudsResult];
  const failure = results.find((result) => result.error)?.error;
  if (failure) throw new Error(failure.message);

  const tubeGroups = new Map<string, Record<string, unknown>>();
  for (const row of (tubesResult.data ?? []) as Record<string, unknown>[]) {
    const key = buildTubeReferenceKey(row as never);
    if (!tubeGroups.has(key)) tubeGroups.set(key, row);
  }
  const tigeGroups = new Map<string, Record<string, unknown>>();
  for (const row of (tigesResult.data ?? []) as Record<string, unknown>[]) {
    const key = buildTigeReferenceKey(row as never);
    if (!tigeGroups.has(key)) tigeGroups.set(key, row);
  }

  const targets: StockLinkTarget[] = [
    ...Array.from(tubeGroups, ([referenceKey, row]) => ({
      id: targetId("tubes", null, referenceKey), stockType: "tubes" as const, referenceId: null, referenceKey,
      famille: "Tubes", label: [clean(row.type), clean(row.section)].filter(Boolean).join(" · ") || "Tube",
      reference: referenceKey,
      caracteristiques: [clean(row.matiere) && `Matière : ${clean(row.matiere)}`, clean(row.type) && `Type : ${clean(row.type)}`, clean(row.section) && `Section : ${clean(row.section)}`, clean(row.epaisseur) && `Épaisseur : ${clean(row.epaisseur)} mm`, clean(row.nuance) && `Nuance : ${clean(row.nuance)}`].filter(Boolean) as string[],
      uniteStock: "mm" as const, conversionSuggeree: 1,
    })),
    ...Array.from(tigeGroups, ([referenceKey, row]) => ({
      id: targetId("tiges_filetees", null, referenceKey), stockType: "tiges_filetees" as const, referenceId: null, referenceKey,
      famille: "Tiges filetées", label: `${clean(row.matiere)} · ${clean(row.diametre)}`,
      reference: referenceKey,
      caracteristiques: [clean(row.matiere) && `Matière : ${clean(row.matiere)}`, clean(row.diametre) && `Diamètre : ${clean(row.diametre)}`].filter(Boolean) as string[],
      uniteStock: "mm" as const, conversionSuggeree: 1,
    })),
    ...((visResult.data ?? []) as Record<string, unknown>[]).map((row) => boxedTarget("vis", "Vis", row)),
    ...((ecrousResult.data ?? []) as Record<string, unknown>[]).map((row) => boxedTarget("ecrous", "Écrous", row)),
    ...((insertsResult.data ?? []) as Record<string, unknown>[]).map((row) => quantityTarget("inserts", "Inserts", row)),
    ...((rivetsResult.data ?? []) as Record<string, unknown>[]).map((row) => boxedTarget("rivets", "Rivets", row)),
    ...((foretsResult.data ?? []) as Record<string, unknown>[]).map((row) => quantityTarget("forets", "Forets", row)),
    ...((fraisesResult.data ?? []) as Record<string, unknown>[]).map((row) => quantityTarget("fraises", "Fraises", row)),
    ...((taraudsResult.data ?? []) as Record<string, unknown>[]).map((row) => quantityTarget("tarauds", "Tarauds", row)),
  ];

  return {
    articles: (catalogueResult.data ?? []) as CatalogueStockLinkArticle[],
    links: (linksResult.data ?? []) as CatalogueStockLink[],
    targets: targets.sort((left, right) => left.famille.localeCompare(right.famille, "fr") || left.label.localeCompare(right.label, "fr")),
  };
}

export async function getStockLinkTarget(stockType: StockLinkSource, referenceId: number | null, referenceKey: string | null) {
  const { targets } = await getCatalogueStockLinkData();
  return targets.find((target) => target.stockType === stockType && target.referenceId === referenceId && target.referenceKey === referenceKey) ?? null;
}
