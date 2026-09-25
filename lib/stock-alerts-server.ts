import { getServerSupabase } from "@/lib/supabase-server";
import {
  createStockAlertsSnapshot,
  type StockAlertSnapshotInput,
  type StockAvecBoitesRow,
  type StockQuantiteRow,
  type TigeStockRow,
  type TubeStockRow,
} from "@/lib/stock-alerts";

function unwrap<T>(result: { data: T[] | null; error: { message: string } | null }, label: string) {
  if (result.error) throw new Error(`Impossible de charger ${label} : ${result.error.message}`);
  return result.data ?? [];
}

/**
 * Source unique pour les futurs badges, centre d'alertes et Dashboard.
 * Les longueurs sont additionnées par référence avant toute comparaison de seuil.
 */
export async function getStockAlertsSnapshot() {
  const supabase = getServerSupabase();
  const [
    tubesResult,
    tigesResult,
    thresholdsResult,
    visResult,
    ecrousResult,
    rivetsResult,
    insertsResult,
    foretsResult,
    fraisesResult,
    taraudsResult,
  ] = await Promise.all([
    supabase.from("stock_tubes").select("id,matiere,type,section,epaisseur,nuance,longueur_disponible,statut"),
    supabase.from("stock_tiges_filetees").select("id,matiere,diametre,longueur_disponible,statut"),
    supabase.from("stock_seuils_longueur").select("source,reference_key,seuil_mm"),
    supabase.from("stock_vis").select("id,reference,designation,matiere,dimension,pieces_par_boite,boites_pleines,pieces_restantes,seuil_boites"),
    supabase.from("stock_ecrous").select("id,reference,designation,matiere,dimension,pieces_par_boite,boites_pleines,pieces_restantes,seuil_boites"),
    supabase.from("stock_rivets").select("id,reference,designation,matiere,dimension,pieces_par_boite,boites_pleines,pieces_restantes,seuil_boites"),
    supabase.from("stock_inserts").select("id,reference,designation,matiere,dimension,quantite,seuil_minimum"),
    supabase.from("stock_forets").select("id,dimension,quantite,seuil_minimum"),
    supabase.from("stock_fraises").select("id,dimension,designation,quantite,seuil_minimum"),
    supabase.from("stock_tarauds").select("id,reference,dimension,quantite,seuil_minimum"),
  ]);

  const input: StockAlertSnapshotInput = {
    tubes: unwrap(tubesResult, "les tubes") as TubeStockRow[],
    tigesFiletees: unwrap(tigesResult, "les tiges filetées") as TigeStockRow[],
    seuilsLongueur: unwrap(thresholdsResult, "les seuils de longueur") as StockAlertSnapshotInput["seuilsLongueur"],
    vis: unwrap(visResult, "les vis") as StockAvecBoitesRow[],
    ecrous: unwrap(ecrousResult, "les écrous") as StockAvecBoitesRow[],
    rivets: unwrap(rivetsResult, "les rivets") as StockAvecBoitesRow[],
    inserts: unwrap(insertsResult, "les inserts") as StockQuantiteRow[],
    forets: unwrap(foretsResult, "les forets") as StockQuantiteRow[],
    fraises: unwrap(fraisesResult, "les fraises") as StockQuantiteRow[],
    tarauds: unwrap(taraudsResult, "les tarauds") as StockQuantiteRow[],
  };

  return createStockAlertsSnapshot(input);
}
