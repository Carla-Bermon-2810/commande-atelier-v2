export type StatutCommandeSuivi = "En attente" | "Partiellement livrée" | "Livrée" | "Annulée";

export type LigneCommandeSuivi = {
  id: string;
  article: string;
  famille: string | null;
  quantiteCommandee: number;
  quantiteRecue: number;
  quantiteRestante: number;
  catalogueId: number | null;
  variante: string | null;
  photo: string | null;
  unite: string | null;
  /** Snapshot technique immuable pour les lignes ajoutées depuis le Stock. */
  stockReferenceSnapshot: StockReferenceSnapshot | null;
};

export type StockReferenceSource =
  | "tubes" | "tiges_filetees" | "vis" | "ecrous" | "inserts"
  | "rivets" | "forets" | "fraises" | "tarauds" | "abrasifs" | "soudure" | "epi" | "consommables";

export type StockReferenceSnapshot = {
  source: StockReferenceSource;
  referenceId?: number;
  referenceKey?: string;
  uniteCommande: "piece" | "boite" | "barre" | "unite";
  uniteStock: "pieces" | "mm" | "unites";
  facteurConversion: number;
  longueurParBarreMm?: number;
  /** Caractéristiques techniques conservées pour créer les futurs morceaux physiques. */
  configuration?: Record<string, string | number | null>;
};

export type OperationStockReception = {
  id: string;
  receptionId: string;
  commandeArticleId: string;
  article: string;
  quantiteRecue: number;
  statut: "en_attente_liaison" | "prete_a_confirmer" | "appliquee" | "ignoree" | "erreur";
  raison?: string | null;
  stockType: StockReferenceSource | null;
  referenceStock: string | null;
  uniteCommande: string | null;
  uniteStock: "pieces" | "mm" | "unites" | null;
  quantiteAAjouter: number | null;
  configuration: Record<string, string | number | null>;
  stockAvant: Record<string, unknown> | null;
  stockApres: Record<string, unknown> | null;
  appliqueeLe: string | null;
  previsualisation: {
    disponible: boolean;
    message?: string;
    stockActuel: number | null;
    stockApres: number | null;
    unite: "pieces" | "mm" | "unites" | null;
  };
};

export type ReceptionCommandeSuivi = {
  id: string;
  dateReception: string;
  commentaire: string | null;
  enregistrePar: string | null;
  lignes: Array<{
    id: string;
    commandeArticleId: string;
    quantiteRecue: number;
  }>;
};

export type CommandeSuivi = {
  id: string;
  numero: string;
  demandeur: string;
  commentaire: string | null;
  dateCommande: string;
  estAnnulee: boolean;
  statut: StatutCommandeSuivi;
  quantiteCommandee: number;
  quantiteRecue: number;
  progression: number;
  lignes: LigneCommandeSuivi[];
  receptions: ReceptionCommandeSuivi[];
  operationsStock: OperationStockReception[];
};

/**
 * Statut calculé, jamais persisté : il est toujours fidèle à l'historique des
 * réceptions, y compris après une correction ou une annulation.
 */
export function calculerStatutCommande(
  lignes: Array<Pick<LigneCommandeSuivi, "quantiteCommandee" | "quantiteRecue">>,
  estAnnulee = false
): StatutCommandeSuivi {
  if (estAnnulee) return "Annulée";

  const commandee = lignes.reduce((total, ligne) => total + ligne.quantiteCommandee, 0);
  const recue = lignes.reduce((total, ligne) => total + ligne.quantiteRecue, 0);

  if (commandee > 0 && recue >= commandee) return "Livrée";
  if (recue > 0) return "Partiellement livrée";
  return "En attente";
}

export function calculerProgressionReception(
  lignes: Array<Pick<LigneCommandeSuivi, "quantiteCommandee" | "quantiteRecue">>
) {
  const commandee = lignes.reduce((total, ligne) => total + ligne.quantiteCommandee, 0);
  const recue = lignes.reduce((total, ligne) => total + ligne.quantiteRecue, 0);

  return {
    quantiteCommandee: commandee,
    quantiteRecue: recue,
    progression: commandee === 0 ? 0 : Math.min(100, Math.round((recue / commandee) * 100)),
  };
}
