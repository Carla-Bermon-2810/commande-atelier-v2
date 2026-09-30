import "server-only";

import { getServerSupabase } from "@/lib/supabase-server";
import {
  calculerProgressionReception,
  calculerStatutCommande,
  type CommandeSuivi,
  type LigneCommandeSuivi,
  type ReceptionCommandeSuivi,
} from "@/lib/commande-suivi";
import { getOperationsStockCommande } from "@/lib/reception-stock-server";

export type CommandeSuiviResume = {
  id: string;
  numero: string;
  demandeur: string;
  dateCommande: string;
  statut: CommandeSuivi["statut"];
  nombreReferences: number;
  quantiteCommandee: number;
  quantiteRecue: number;
  progression: number;
  /** Chaîne de recherche dérivée des snapshots, jamais affichée telle quelle. */
  termesRecherche: string;
  statutEntreeStock: "À confirmer" | "Ajoutée au Stock" | "Sans entrée Stock";
  aTraiter: boolean;
};

type CommandeRow = {
  id: string;
  numero: string;
  demandeur: string;
  commentaire: string | null;
  date_commande: string;
  annulee_le: string | null;
};

type LigneCommandeRow = {
  id: string;
  article: string;
  famille: string | null;
  quantite: number;
  catalogue_id: number | null;
  designation_snapshot: string | null;
  variante_snapshot: string | null;
  photo_snapshot: string | null;
  unite_snapshot: string | null;
  stock_reference_snapshot: unknown;
};

type ReceptionRow = {
  id: string;
  commentaire: string | null;
  enregistre_par: string | null;
  date_reception: string;
};

type ReceptionLigneRow = {
  id: string;
  reception_id: string;
  commande_article_id: string;
  quantite_recue: number;
};

export type NouvelleReception = {
  commandeId: string;
  lignes: Array<{ commandeArticleId: string; quantiteRecue: number }>;
  commentaire?: string;
  enregistrePar?: string;
  idempotencyKey: string;
};

export async function getCommandeSuivi(commandeId: string): Promise<CommandeSuivi | null> {
  const supabase = getServerSupabase();
  const { data: commande, error: commandeError } = await supabase
    .from("commandes")
    .select("id, numero, demandeur, commentaire, date_commande, annulee_le")
    .eq("id", commandeId)
    .maybeSingle<CommandeRow>();

  if (commandeError) throw commandeError;
  if (!commande) return null;

  const { data: lignes, error: lignesError } = await supabase
    .from("commande_articles")
    .select("id, article, famille, quantite, catalogue_id, designation_snapshot, variante_snapshot, photo_snapshot, unite_snapshot, stock_reference_snapshot")
    .eq("commande_id", commandeId)
    .returns<LigneCommandeRow[]>();

  if (lignesError) throw lignesError;

  const ligneIds = (lignes ?? []).map((ligne) => ligne.id);
  const { data: lignesReception, error: lignesReceptionError } = ligneIds.length === 0
    ? { data: [] as ReceptionLigneRow[], error: null }
    : await supabase
      .from("commande_reception_lignes")
      .select("id, reception_id, commande_article_id, quantite_recue")
      .in("commande_article_id", ligneIds)
      .returns<ReceptionLigneRow[]>();

  if (lignesReceptionError) throw lignesReceptionError;

  const receptionIds = [...new Set((lignesReception ?? []).map((ligne) => ligne.reception_id))];
  const { data: receptions, error: receptionsError } = receptionIds.length === 0
    ? { data: [] as ReceptionRow[], error: null }
    : await supabase
      .from("commande_receptions")
      .select("id, commentaire, enregistre_par, date_reception")
      .in("id", receptionIds)
      .order("date_reception", { ascending: false })
      .returns<ReceptionRow[]>();

  if (receptionsError) throw receptionsError;

  const recuParLigne = new Map<string, number>();
  for (const ligne of lignesReception ?? []) {
    recuParLigne.set(
      ligne.commande_article_id,
      (recuParLigne.get(ligne.commande_article_id) ?? 0) + ligne.quantite_recue
    );
  }

  const lignesSuivi: LigneCommandeSuivi[] = (lignes ?? []).map((ligne) => {
    const quantiteRecue = recuParLigne.get(ligne.id) ?? 0;
    return {
      id: ligne.id,
      article: ligne.designation_snapshot || ligne.article,
      famille: ligne.famille,
      quantiteCommandee: ligne.quantite,
      quantiteRecue,
      quantiteRestante: Math.max(0, ligne.quantite - quantiteRecue),
      catalogueId: ligne.catalogue_id,
      variante: ligne.variante_snapshot,
      photo: ligne.photo_snapshot,
      unite: ligne.unite_snapshot,
      stockReferenceSnapshot: ligne.stock_reference_snapshot as LigneCommandeSuivi["stockReferenceSnapshot"],
    };
  });

  const lignesParReception = new Map<string, ReceptionLigneRow[]>();
  for (const ligne of lignesReception ?? []) {
    const existantes = lignesParReception.get(ligne.reception_id) ?? [];
    existantes.push(ligne);
    lignesParReception.set(ligne.reception_id, existantes);
  }

  const receptionsSuivi: ReceptionCommandeSuivi[] = (receptions ?? []).map((reception) => ({
    id: reception.id,
    dateReception: reception.date_reception,
    commentaire: reception.commentaire,
    enregistrePar: reception.enregistre_par,
    lignes: (lignesParReception.get(reception.id) ?? []).map((ligne) => ({
      id: ligne.id,
      commandeArticleId: ligne.commande_article_id,
      quantiteRecue: ligne.quantite_recue,
    })),
  }));

  const progression = calculerProgressionReception(lignesSuivi);
  const operationsStock = await getOperationsStockCommande(commandeId);

  return {
    id: commande.id,
    numero: commande.numero,
    demandeur: commande.demandeur,
    commentaire: commande.commentaire,
    dateCommande: commande.date_commande,
    estAnnulee: Boolean(commande.annulee_le),
    statut: calculerStatutCommande(lignesSuivi, Boolean(commande.annulee_le)),
    ...progression,
    lignes: lignesSuivi,
    receptions: receptionsSuivi,
    operationsStock,
  };
}

/** Liste compacte pour le panneau gauche du suivi, calculée depuis les réceptions. */
export async function getCommandesSuivi(): Promise<CommandeSuiviResume[]> {
  const supabase = getServerSupabase();
  const { data: commandes, error: commandesError } = await supabase
    .from("commandes")
    .select("id, numero, demandeur, date_commande, annulee_le")
    .order("date_commande", { ascending: false })
    .limit(200)
    .returns<Array<Pick<CommandeRow, "id" | "numero" | "demandeur" | "date_commande" | "annulee_le">>>();

  if (commandesError) throw commandesError;
  if (!commandes?.length) return [];

  const commandeIds = commandes.map((commande) => commande.id);
  const { data: lignes, error: lignesError } = await supabase
    .from("commande_articles")
    .select("id, commande_id, quantite, article, designation_snapshot, variante_snapshot, stock_reference_snapshot")
    .in("commande_id", commandeIds)
    .returns<Array<{ id: string; commande_id: string; quantite: number; article: string; designation_snapshot: string | null; variante_snapshot: string | null; stock_reference_snapshot: unknown }>>();

  if (lignesError) throw lignesError;

  const ligneIds = (lignes ?? []).map((ligne) => ligne.id);
  const { data: receptions, error: receptionsError } = ligneIds.length === 0
    ? { data: [] as Array<{ id: string; commande_article_id: string; quantite_recue: number }>, error: null }
    : await supabase
      .from("commande_reception_lignes")
      .select("id, commande_article_id, quantite_recue")
      .in("commande_article_id", ligneIds)
      .returns<Array<{ id: string; commande_article_id: string; quantite_recue: number }>>();

  if (receptionsError) throw receptionsError;

  const recuParLigne = new Map<string, number>();
  for (const reception of receptions ?? []) {
    recuParLigne.set(
      reception.commande_article_id,
      (recuParLigne.get(reception.commande_article_id) ?? 0) + reception.quantite_recue
    );
  }

  const lignesParCommande = new Map<string, Array<{ quantiteCommandee: number; quantiteRecue: number }>>();
  for (const ligne of lignes ?? []) {
    const lignesCommande = lignesParCommande.get(ligne.commande_id) ?? [];
    lignesCommande.push({
      quantiteCommandee: ligne.quantite,
      quantiteRecue: recuParLigne.get(ligne.id) ?? 0,
    });
    lignesParCommande.set(ligne.commande_id, lignesCommande);
  }

  const receptionLineIds = (receptions ?? []).map((ligne) => ligne.id);
  const { data: operations, error: operationsError } = receptionLineIds.length === 0
    ? { data: [] as Array<{ commande_reception_ligne_id: string; statut: string }>, error: null }
    : await supabase
      .from("reception_stock_operations")
      .select("commande_reception_ligne_id, statut")
      .in("commande_reception_ligne_id", receptionLineIds)
      .returns<Array<{ commande_reception_ligne_id: string; statut: string }>>();

  if (operationsError) throw operationsError;

  const commandeParLigneReception = new Map((receptions ?? []).map((ligne) => {
    const ligneCommande = (lignes ?? []).find((item) => item.id === ligne.commande_article_id);
    return [ligne.id, ligneCommande?.commande_id] as const;
  }));
  const operationsParCommande = new Map<string, string[]>();
  for (const operation of operations ?? []) {
    const commandeId = commandeParLigneReception.get(operation.commande_reception_ligne_id);
    if (!commandeId) continue;
    const statuts = operationsParCommande.get(commandeId) ?? [];
    statuts.push(operation.statut);
    operationsParCommande.set(commandeId, statuts);
  }

  return commandes.map((commande) => {
    const lignesCommande = lignesParCommande.get(commande.id) ?? [];
    const progression = calculerProgressionReception(lignesCommande);
    const statutsOperations = operationsParCommande.get(commande.id) ?? [];
    const statutCommande = calculerStatutCommande(lignesCommande, Boolean(commande.annulee_le));
    const statutEntreeStock = statutsOperations.includes("prete_a_confirmer")
      ? "À confirmer"
      : statutsOperations.includes("appliquee")
        ? "Ajoutée au Stock"
        : "Sans entrée Stock";
    const termesRecherche = (lignes ?? [])
      .filter((ligne) => ligne.commande_id === commande.id)
      .map((ligne) => {
        const snapshot = ligne.stock_reference_snapshot as { referenceKey?: unknown } | null;
        return [ligne.article, ligne.designation_snapshot, ligne.variante_snapshot, typeof snapshot?.referenceKey === "string" ? snapshot.referenceKey : ""].filter(Boolean).join(" ");
      })
      .join(" ");
    return {
      id: commande.id,
      numero: commande.numero,
      demandeur: commande.demandeur,
      dateCommande: commande.date_commande,
      statut: statutCommande,
      nombreReferences: lignesCommande.length,
      ...progression,
      termesRecherche,
      statutEntreeStock,
      aTraiter: statutCommande === "En attente" || statutCommande === "Partiellement livrée" || statutEntreeStock === "À confirmer",
    };
  });
}

export async function enregistrerReception(reception: NouvelleReception) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.rpc("enregistrer_reception_commande", {
    p_commande_id: reception.commandeId,
    p_lignes: reception.lignes.map((ligne) => ({
      commande_article_id: ligne.commandeArticleId,
      quantite_recue: ligne.quantiteRecue,
    })),
    p_commentaire: reception.commentaire?.trim() || null,
    p_enregistre_par: reception.enregistrePar?.trim() || null,
    p_idempotency_key: reception.idempotencyKey,
  });

  if (error) throw error;
  return data as string;
}
