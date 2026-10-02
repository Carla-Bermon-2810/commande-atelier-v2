import { getServerSupabase } from "@/lib/supabase-server";

export type StockCatalogueType = "abrasifs" | "soudure" | "epi" | "consommables";
export type StockArticleCatalogue = {
  id: number;
  catalogueId: number;
  referenceMetierId: string;
  stockType: StockCatalogueType;
  famille: string;
  designation: string;
  caracteristique: string | null;
  dimension: string | null;
  photo: string | null;
  description: string | null;
  etatInitialisation: "a_initialiser" | "initialise";
  uniteLibelle: string | null;
  conditionnementLabel: string | null;
  facteurConversion: number | null;
  quantiteDisponible: number | null;
  seuilMinimum: number | null;
};

type Row = {
  id: number;
  catalogue_id: number;
  reference_metier_id: string;
  stock_type: StockCatalogueType;
  famille_catalogue_snapshot: string;
  designation_snapshot: string;
  caracteristique_snapshot: string | null;
  dimension_snapshot: string | null;
  photo_snapshot: string | null;
  description_snapshot: string | null;
  etat_initialisation: "a_initialiser" | "initialise";
  unite_libelle: string | null;
  conditionnement_label: string | null;
  facteur_conversion: number | string | null;
  quantite_disponible: number | string | null;
  seuil_minimum: number | string | null;
};

function numberOrNull(value: number | string | null) {
  if (value === null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function publicPhotoUrl(photo: string | null) {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://") || photo.startsWith("/")) return photo;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return baseUrl ? `${baseUrl}/storage/v1/object/public/photos/${photo}` : null;
}

function toArticle(row: Row): StockArticleCatalogue {
  return {
    id: row.id,
    catalogueId: row.catalogue_id,
    referenceMetierId: row.reference_metier_id,
    stockType: row.stock_type,
    famille: row.famille_catalogue_snapshot,
    designation: row.designation_snapshot,
    caracteristique: row.caracteristique_snapshot,
    dimension: row.dimension_snapshot,
    photo: publicPhotoUrl(row.photo_snapshot),
    description: row.description_snapshot,
    etatInitialisation: row.etat_initialisation,
    uniteLibelle: row.unite_libelle,
    conditionnementLabel: row.conditionnement_label,
    facteurConversion: numberOrNull(row.facteur_conversion),
    quantiteDisponible: numberOrNull(row.quantite_disponible),
    seuilMinimum: numberOrNull(row.seuil_minimum),
  };
}

export async function getStockArticlesCatalogue(type?: StockCatalogueType) {
  const supabase = getServerSupabase();
  let query = supabase
    .from("stock_articles_catalogue")
    .select("id,catalogue_id,reference_metier_id,stock_type,famille_catalogue_snapshot,designation_snapshot,caracteristique_snapshot,dimension_snapshot,photo_snapshot,description_snapshot,etat_initialisation,unite_libelle,conditionnement_label,facteur_conversion,quantite_disponible,seuil_minimum")
    .eq("actif", true)
    .order("famille_catalogue_snapshot")
    .order("designation_snapshot");
  if (type) query = query.eq("stock_type", type);
  const { data, error } = await query.returns<Row[]>();
  if (error) throw new Error(`Impossible de charger les références : ${error.message}`);
  return (data ?? []).map(toArticle);
}

export function stockCatalogueTypeLabel(type: StockCatalogueType) {
  return ({ abrasifs: "Abrasifs", soudure: "Soudure", epi: "EPI", consommables: "Consommables" })[type];
}
