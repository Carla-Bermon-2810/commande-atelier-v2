import { supabase } from "./supabase";
import { CartItem } from "@/context/cart-context";

export async function envoyerCommande(
  demandeur: string,
  commentaire: string,
  panier: CartItem[]
) {
  const { data: commande, error } = await supabase
    .from("commandes")
    .insert({
      demandeur,
      commentaire,
      statut: "Nouvelle",
    })
    .select()
    .single();

  if (error) throw error;

  const lignes = panier.map((item) => ({
    commande_id: commande.id,
    article: item.article,
    quantite: item.quantite,
  }));

  const { error: lignesError } = await supabase
    .from("commande_articles")
    .insert(lignes);

  if (lignesError) throw lignesError;

  return commande;
}