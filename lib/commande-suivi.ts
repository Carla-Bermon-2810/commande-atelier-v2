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
