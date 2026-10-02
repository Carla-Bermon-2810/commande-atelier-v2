import "server-only";

import { getServerSupabase } from "@/lib/supabase-server";
import { buildTigeReferenceKey, buildTubeReferenceKey, type StockAlertSource } from "@/lib/stock-alerts";
import type { OperationStockReception, StockReferenceSnapshot } from "@/lib/commande-suivi";

type ReceptionLineRow = { id: string; reception_id: string; commande_article_id: string; quantite_recue: number };
type CommandLineRow = { id: string; article: string; designation_snapshot: string | null; stock_reference_snapshot: unknown };
type OperationRow = {
  id: string; commande_reception_ligne_id: string; statut: OperationStockReception["statut"]; stock_type: StockAlertSource | null;
  stock_reference_id: number | null; stock_reference_key: string | null; unite_commande: string | null; unite_stock: "pieces" | "mm" | "unites" | null;
  quantite_recue: number; quantite_a_ajouter: number | string | null; details_reception: unknown; stock_avant: Record<string, unknown> | null;
  stock_apres: Record<string, unknown> | null; appliquee_le: string | null; erreur: string | null;
};

const SOURCES: StockAlertSource[] = ["tubes", "tiges_filetees", "vis", "ecrous", "inserts", "rivets", "forets", "fraises", "tarauds", "abrasifs", "soudure", "epi", "consommables"];
const LENGTH_SOURCES = new Set<StockAlertSource>(["tubes", "tiges_filetees"]);

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asConfig(value: unknown): Record<string, string | number | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, item]) => item === null || typeof item === "string" || typeof item === "number")) as Record<string, string | number | null>;
}

function parseSnapshot(value: unknown): StockReferenceSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Record<string, unknown>;
  const source = snapshot.source;
  const referenceId = Number(snapshot.referenceId);
  const referenceKey = typeof snapshot.referenceKey === "string" ? snapshot.referenceKey.trim() : "";
  const facteurConversion = Number(snapshot.facteurConversion);
  if (
    typeof source !== "string" || !SOURCES.includes(source as StockAlertSource) ||
    (!Number.isSafeInteger(referenceId) && !referenceKey) ||
    !["piece", "boite", "barre", "unite"].includes(String(snapshot.uniteCommande)) ||
    !["pieces", "mm", "unites"].includes(String(snapshot.uniteStock)) ||
    !Number.isFinite(facteurConversion) || facteurConversion <= 0
  ) return null;

  const longueurParBarreMm = numberOrNull(snapshot.longueurParBarreMm);
  return {
    source: source as StockAlertSource,
    referenceId: Number.isSafeInteger(referenceId) ? referenceId : undefined,
    referenceKey: referenceKey || undefined,
    uniteCommande: snapshot.uniteCommande as StockReferenceSnapshot["uniteCommande"],
    uniteStock: snapshot.uniteStock as StockReferenceSnapshot["uniteStock"],
    facteurConversion,
    longueurParBarreMm: longueurParBarreMm && longueurParBarreMm > 0 ? longueurParBarreMm : undefined,
    configuration: asConfig(snapshot.configuration),
  };
}

async function resolveLengthConfiguration(snapshot: StockReferenceSnapshot) {
  const supabase = getServerSupabase();
  if (snapshot.configuration && Object.keys(snapshot.configuration).length > 0) return snapshot.configuration;
  if (!snapshot.referenceKey) return {};

  if (snapshot.source === "tubes") {
    const { data, error } = await supabase.from("stock_tubes").select("matiere,type,section,epaisseur,nuance");
    if (error) throw error;
    const row = (data ?? []).find((item) => buildTubeReferenceKey(item) === snapshot.referenceKey);
    return row ? { matiere: row.matiere, type: row.type, section: row.section, epaisseur: row.epaisseur === null ? null : Number(row.epaisseur), nuance: row.nuance ?? null } : {};
  }

  const { data, error } = await supabase.from("stock_tiges_filetees").select("matiere,diametre");
  if (error) throw error;
  const row = (data ?? []).find((item) => buildTigeReferenceKey(item) === snapshot.referenceKey);
  return row ? { matiere: row.matiere, diametre: row.diametre } : {};
}

/** Crée uniquement le dossier de prévisualisation, jamais une entrée Stock. */
export async function preparerOperationsStockReception(receptionId: string) {
  const supabase = getServerSupabase();
  const { data: receptionLines, error: receptionError } = await supabase
    .from("commande_reception_lignes")
    .select("id,reception_id,commande_article_id,quantite_recue")
    .eq("reception_id", receptionId)
    .returns<ReceptionLineRow[]>();
  if (receptionError) throw receptionError;
  const articleIds = (receptionLines ?? []).map((line) => line.commande_article_id);
  if (!articleIds.length) return [];
  const { data: orderLines, error: linesError } = await supabase
    .from("commande_articles")
    .select("id,article,designation_snapshot,stock_reference_snapshot")
    .in("id", articleIds)
    .returns<CommandLineRow[]>();
  if (linesError) throw linesError;
  const lineById = new Map((orderLines ?? []).map((line) => [line.id, line]));

  const payload = [];
  for (const receptionLine of receptionLines ?? []) {
    const commandLine = lineById.get(receptionLine.commande_article_id);
    const snapshot = parseSnapshot(commandLine?.stock_reference_snapshot);
    if (!snapshot) {
      payload.push({
        commande_reception_ligne_id: receptionLine.id, statut: "en_attente_liaison", quantite_recue: receptionLine.quantite_recue,
        details_reception: { article: commandLine?.designation_snapshot || commandLine?.article || "Article", raison: "Aucune référence Stock technique validée n’est enregistrée pour cette ligne." },
        erreur: "Aucune référence Stock technique validée n’est enregistrée pour cette ligne.",
      });
      continue;
    }
    const configuration = LENGTH_SOURCES.has(snapshot.source) ? await resolveLengthConfiguration(snapshot) : snapshot.configuration ?? {};
    const isLength = LENGTH_SOURCES.has(snapshot.source);
    const ready = !isLength || (snapshot.referenceKey && Object.keys(configuration).length > 0);
    payload.push({
      commande_reception_ligne_id: receptionLine.id,
      statut: ready ? "prete_a_confirmer" : "en_attente_liaison",
      stock_type: snapshot.source,
      stock_reference_id: snapshot.referenceId ?? null,
      stock_reference_key: snapshot.referenceKey ?? null,
      unite_commande: snapshot.uniteCommande,
      unite_stock: snapshot.uniteStock,
      quantite_recue: receptionLine.quantite_recue,
      quantite_a_ajouter: isLength ? null : receptionLine.quantite_recue * snapshot.facteurConversion,
      details_reception: { article: commandLine?.designation_snapshot || commandLine?.article || "Article", snapshot, configuration, raison: ready ? null : "Les caractéristiques physiques de cette référence ne sont plus disponibles." },
      erreur: ready ? null : "Les caractéristiques physiques de cette référence ne sont plus disponibles.",
    });
  }

  const { error: upsertError } = await supabase.from("reception_stock_operations").upsert(payload, { onConflict: "commande_reception_ligne_id", ignoreDuplicates: true });
  if (upsertError) throw upsertError;
  return getOperationsStockCommandeByReception(receptionId);
}

function operationDetails(row: OperationRow) {
  const details = row.details_reception && typeof row.details_reception === "object" ? row.details_reception as Record<string, unknown> : {};
  return { article: typeof details.article === "string" ? details.article : "Article", configuration: asConfig(details.configuration), raison: typeof details.raison === "string" ? details.raison : row.erreur };
}

async function previewOperation(row: OperationRow, configuration: Record<string, string | number | null>) {
  const supabase = getServerSupabase();
  if (row.statut === "appliquee") {
    const after = row.stock_apres ?? {};
    const key = row.unite_stock === "mm" ? "longueur_totale_mm" : "pieces";
    return { disponible: true, stockActuel: numberOrNull((row.stock_avant ?? {})[key]), stockApres: numberOrNull(after[key]), unite: row.unite_stock };
  }
  if (row.statut !== "prete_a_confirmer" || !row.stock_type) return { disponible: false, message: row.erreur ?? "Aucune entrée Stock n’est proposée pour cette ligne.", stockActuel: null, stockApres: null, unite: row.unite_stock };
  try {
    if (row.stock_type === "tubes" || row.stock_type === "tiges_filetees") {
      if (!Object.keys(configuration).length) return { disponible: false, message: "Caractéristiques physiques indisponibles.", stockActuel: null, stockApres: null, unite: "mm" as const };
      const table = row.stock_type === "tubes" ? "stock_tubes" : "stock_tiges_filetees";
      const { data, error } = await supabase.from(table).select("longueur_disponible,statut,matiere,type,section,epaisseur,nuance,diametre");
      if (error) throw error;
      const total = (data ?? []).filter((item) => item.statut === "disponible").filter((item) => {
        if (row.stock_type === "tubes") return item.matiere === configuration.matiere && item.type === configuration.type && item.section === configuration.section && String(item.epaisseur ?? "") === String(configuration.epaisseur ?? "") && String(item.nuance ?? "") === String(configuration.nuance ?? "");
        return item.matiere === configuration.matiere && item.diametre === configuration.diametre;
      }).reduce((sum, item) => sum + Number(item.longueur_disponible ?? 0), 0);
      return { disponible: true, stockActuel: total, stockApres: null, unite: "mm" as const };
    }
    if (!row.stock_reference_id || !row.quantite_a_ajouter) return { disponible: false, message: "Référence Stock ou conversion indisponible.", stockActuel: null, stockApres: null, unite: row.unite_stock };
    if (["abrasifs", "soudure", "epi", "consommables"].includes(row.stock_type)) {
      const { data, error } = await supabase.from("stock_articles_catalogue").select("id,quantite_disponible,etat_initialisation").eq("id", row.stock_reference_id).maybeSingle();
      if (error) throw error;
      if (!data || data.etat_initialisation !== "initialise" || data.quantite_disponible === null) return { disponible: false, message: "La référence Stock n’est plus initialisée.", stockActuel: null, stockApres: null, unite: "unites" as const };
      const stock = Number(data.quantite_disponible);
      const added = Number(row.quantite_a_ajouter);
      return { disponible: true, stockActuel: stock, stockApres: stock + added, unite: "unites" as const };
    }
    const tableByType: Record<string, string> = { vis: "stock_vis", ecrous: "stock_ecrous", rivets: "stock_rivets", inserts: "stock_inserts", forets: "stock_forets", fraises: "stock_fraises", tarauds: "stock_tarauds" };
    const table = tableByType[row.stock_type];
    const { data, error } = await supabase.from(table).select("id,boites_pleines,pieces_restantes,pieces_par_boite,quantite").eq("id", row.stock_reference_id).maybeSingle();
    if (error) throw error;
    if (!data) return { disponible: false, message: "La référence Stock n’existe plus.", stockActuel: null, stockApres: null, unite: "pieces" as const };
    const stock = ["vis", "ecrous", "rivets"].includes(row.stock_type)
      ? Number(data.boites_pleines ?? 0) * Number(data.pieces_par_boite ?? 0) + (row.stock_type === "vis" ? 0 : Number(data.pieces_restantes ?? 0))
      : Number(data.quantite ?? 0);
    const added = Number(row.quantite_a_ajouter);
    return { disponible: true, stockActuel: stock, stockApres: stock + added, unite: "pieces" as const };
  } catch {
    return { disponible: false, message: "Impossible de vérifier le Stock actuel.", stockActuel: null, stockApres: null, unite: row.unite_stock };
  }
}

async function hydrateOperations(rows: OperationRow[], receptionByLine: Map<string, string>) {
  return Promise.all(rows.map(async (row): Promise<OperationStockReception> => {
    const details = operationDetails(row);
    return {
      id: row.id, receptionId: receptionByLine.get(row.commande_reception_ligne_id) ?? "", commandeArticleId: "", article: details.article,
      quantiteRecue: row.quantite_recue, statut: row.statut, raison: details.raison, stockType: row.stock_type,
      referenceStock: row.stock_reference_key ?? (row.stock_reference_id ? `${row.stock_type} #${row.stock_reference_id}` : null),
      uniteCommande: row.unite_commande, uniteStock: row.unite_stock, quantiteAAjouter: numberOrNull(row.quantite_a_ajouter), configuration: details.configuration,
      stockAvant: row.stock_avant, stockApres: row.stock_apres, appliqueeLe: row.appliquee_le,
      previsualisation: await previewOperation(row, details.configuration),
    };
  }));
}

export async function getOperationsStockCommande(commandeId: string) {
  const supabase = getServerSupabase();
  const { data: receptionLines, error: receptionError } = await supabase.from("commande_reception_lignes").select("id,reception_id,commande_article_id,quantite_recue,commande_receptions!inner(commande_id)").eq("commande_receptions.commande_id", commandeId).returns<ReceptionLineRow[]>();
  if (receptionError) throw receptionError;
  const lineIds = (receptionLines ?? []).map((line) => line.id);
  if (!lineIds.length) return [];
  const { data, error } = await supabase.from("reception_stock_operations").select("id,commande_reception_ligne_id,statut,stock_type,stock_reference_id,stock_reference_key,unite_commande,unite_stock,quantite_recue,quantite_a_ajouter,details_reception,stock_avant,stock_apres,appliquee_le,erreur").in("commande_reception_ligne_id", lineIds).order("created_at", { ascending: false }).returns<OperationRow[]>();
  if (error) throw error;
  return hydrateOperations(data ?? [], new Map((receptionLines ?? []).map((line) => [line.id, line.reception_id])));
}

async function getOperationsStockCommandeByReception(receptionId: string) {
  const supabase = getServerSupabase();
  const { data: lines, error: linesError } = await supabase.from("commande_reception_lignes").select("id,reception_id,commande_article_id,quantite_recue").eq("reception_id", receptionId).returns<ReceptionLineRow[]>();
  if (linesError) throw linesError;
  const ids = (lines ?? []).map((line) => line.id);
  if (!ids.length) return [];
  const { data, error } = await supabase.from("reception_stock_operations").select("id,commande_reception_ligne_id,statut,stock_type,stock_reference_id,stock_reference_key,unite_commande,unite_stock,quantite_recue,quantite_a_ajouter,details_reception,stock_avant,stock_apres,appliquee_le,erreur").in("commande_reception_ligne_id", ids).returns<OperationRow[]>();
  if (error) throw error;
  return hydrateOperations(data ?? [], new Map((lines ?? []).map((line) => [line.id, line.reception_id])));
}

export async function appliquerOperationStock(args: { commandeId: string; operationId: string; longueursMm: number[]; appliqueePar?: string; idempotencyKey: string }) {
  const operations = await getOperationsStockCommande(args.commandeId);
  const operation = operations.find((item) => item.id === args.operationId);
  if (!operation) throw new Error("Cette opération ne correspond pas à la commande sélectionnée.");
  const supabase = getServerSupabase();
  const generic = ["abrasifs", "soudure", "epi", "consommables"].includes(operation.stockType ?? "");
  const { data, error } = generic
    ? await supabase.rpc("appliquer_reception_stock_article_catalogue_operation", {
      p_operation_id: args.operationId, p_appliquee_par: args.appliqueePar?.trim() || null, p_application_idempotency_key: args.idempotencyKey,
    })
    : await supabase.rpc("appliquer_reception_stock_operation", {
      p_operation_id: args.operationId, p_longueurs_mm: args.longueursMm, p_appliquee_par: args.appliqueePar?.trim() || null, p_application_idempotency_key: args.idempotencyKey,
    });
  if (error) throw new Error(error.message);
  return data as { status: "applied" | "already_applied" };
}
