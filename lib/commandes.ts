import { CartItem } from "@/context/cart-context";

export async function envoyerCommande(
  demandeur: string,
  commentaire: string,
  panier: CartItem[]
) {
  // Ce composant historique reste compatible, mais n'écrit plus jamais dans
  // Supabase depuis le navigateur : l'API serveur applique désormais les
  // snapshots de commande et les droits d'accès prévus pour la production.
  const response = await fetch("/api/send-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demandeur, commentaire, articles: panier }),
  });

  const result: { success?: boolean; message?: string; commandeId?: string; numero?: string } = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message ?? "Impossible d’enregistrer la commande.");
  }

  return { id: result.commandeId, numero: result.numero };
}
