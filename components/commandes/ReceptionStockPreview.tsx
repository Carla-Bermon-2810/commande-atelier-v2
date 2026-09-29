"use client";

import CommandesSuiviClient from "@/components/commandes/CommandesSuiviClient";
import type { CommandeSuivi } from "@/lib/commande-suivi";

const date = "2026-09-29T10:30:00.000Z";

const commandes: CommandeSuivi[] = [
  {
    id: "preview-vis", numero: "APERÇU-VIS-M8-30", demandeur: "Prévisualisation locale", commentaire: null,
    dateCommande: date, estAnnulee: false, statut: "Livrée", quantiteCommandee: 2, quantiteRecue: 2, progression: 100,
    lignes: [{ id: "preview-vis-line", article: "Vis M8 × 30", famille: "Vis", quantiteCommandee: 2, quantiteRecue: 2, quantiteRestante: 0, catalogueId: null, variante: "2 boîtes de 100 pièces", photo: null, unite: "boîte", stockReferenceSnapshot: { source: "vis", referenceId: 7, referenceKey: "VHC-M8x30", uniteCommande: "boite", uniteStock: "pieces", facteurConversion: 100 } }],
    receptions: [{ id: "preview-vis-reception", dateReception: date, commentaire: "Réception complète", enregistrePar: "Prévisualisation", lignes: [{ id: "preview-vis-reception-line", commandeArticleId: "preview-vis-line", quantiteRecue: 2 }] }],
    operationsStock: [{ id: "preview-vis-operation", receptionId: "preview-vis-reception", commandeArticleId: "preview-vis-line", article: "Vis M8 × 30", quantiteRecue: 2, statut: "prete_a_confirmer", stockType: "vis", referenceStock: "VHC-M8x30", uniteCommande: "boite", uniteStock: "pieces", quantiteAAjouter: 200, configuration: {}, stockAvant: { pieces: 40 }, stockApres: { pieces: 240 }, appliqueeLe: null, previsualisation: { disponible: true, stockActuel: 40, stockApres: 240, unite: "pieces" } }],
  },
  {
    id: "preview-tubes", numero: "APERÇU-TUBES", demandeur: "Prévisualisation locale", commentaire: null,
    dateCommande: date, estAnnulee: false, statut: "Livrée", quantiteCommandee: 2, quantiteRecue: 2, progression: 100,
    lignes: [{ id: "preview-tubes-line", article: "Tube Inox rond Ø 70 × 2 mm", famille: "Tubes", quantiteCommandee: 2, quantiteRecue: 2, quantiteRestante: 0, catalogueId: null, variante: "Inox · Brut 316L", photo: null, unite: "barre", stockReferenceSnapshot: { source: "tubes", referenceKey: "TUBE-INOX-ROND-70-2", uniteCommande: "barre", uniteStock: "mm", facteurConversion: 1, configuration: { matiere: "Inox", type: "Rond", section: "Ø 70", epaisseur: 2, nuance: "Brut 316L" } } }],
    receptions: [{ id: "preview-tubes-reception", dateReception: date, commentaire: "Longueurs contrôlées à la réception", enregistrePar: "Prévisualisation", lignes: [{ id: "preview-tubes-reception-line", commandeArticleId: "preview-tubes-line", quantiteRecue: 2 }] }],
    operationsStock: [{ id: "preview-tubes-operation", receptionId: "preview-tubes-reception", commandeArticleId: "preview-tubes-line", article: "Tube Inox rond Ø 70 × 2 mm", quantiteRecue: 2, statut: "prete_a_confirmer", stockType: "tubes", referenceStock: "TUBE-INOX-ROND-70-2", uniteCommande: "barre", uniteStock: "mm", quantiteAAjouter: null, configuration: { matiere: "Inox", type: "Rond", section: "Ø 70", epaisseur: 2, nuance: "Brut 316L" }, stockAvant: { longueur_totale_mm: 2_400 }, stockApres: null, appliqueeLe: null, previsualisation: { disponible: true, stockActuel: 2_400, stockApres: null, unite: "mm" } }],
  },
  {
    id: "preview-partiel", numero: "APERÇU-RÉCEPTION-PARTIELLE", demandeur: "Prévisualisation locale", commentaire: "Une boîte reste à livrer plus tard.",
    dateCommande: date, estAnnulee: false, statut: "Partiellement livrée", quantiteCommandee: 3, quantiteRecue: 1, progression: 33,
    lignes: [{ id: "preview-partiel-line", article: "Vis M8 × 30", famille: "Vis", quantiteCommandee: 3, quantiteRecue: 1, quantiteRestante: 2, catalogueId: null, variante: "Boîte de 100 pièces", photo: null, unite: "boîte", stockReferenceSnapshot: { source: "vis", referenceId: 7, referenceKey: "VHC-M8x30", uniteCommande: "boite", uniteStock: "pieces", facteurConversion: 100 } }],
    receptions: [{ id: "preview-partiel-reception", dateReception: date, commentaire: "Une boîte réceptionnée", enregistrePar: "Prévisualisation", lignes: [{ id: "preview-partiel-reception-line", commandeArticleId: "preview-partiel-line", quantiteRecue: 1 }] }],
    operationsStock: [{ id: "preview-partiel-operation", receptionId: "preview-partiel-reception", commandeArticleId: "preview-partiel-line", article: "Vis M8 × 30", quantiteRecue: 1, statut: "prete_a_confirmer", stockType: "vis", referenceStock: "VHC-M8x30", uniteCommande: "boite", uniteStock: "pieces", quantiteAAjouter: 100, configuration: {}, stockAvant: { pieces: 40 }, stockApres: { pieces: 140 }, appliqueeLe: null, previsualisation: { disponible: true, stockActuel: 40, stockApres: 140, unite: "pieces" } }],
  },
];

export default function ReceptionStockPreview({ selectedId = "preview-vis" }: { selectedId?: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm text-orange-950">
        <strong>Prévisualisation locale.</strong> Ces trois commandes n’existent qu’en mémoire : aucune écriture Supabase, aucun mouvement de Stock et aucune confirmation réelle ne sont possibles ici. Actualiser la page réaffiche les entrées « À confirmer ».
      </div>
      <CommandesSuiviClient preview={{
        commandes,
        selectedId,
        longueursRecues: { "preview-tubes-operation": ["6000", "3000"] },
      }} />
    </div>
  );
}
