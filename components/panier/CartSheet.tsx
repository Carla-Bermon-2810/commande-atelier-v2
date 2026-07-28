"use client";

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { envoyerCommande } from "@/lib/commandes";
import {
  Plus,
  Minus,
  Trash2,
} from "lucide-react";

export default function CartSheet() {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    totalItems,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [commentaire, setCommentaire] = useState("");

  async function handleCommande() {
    try {
      setLoading(true);
  
      await envoyerCommande(
        "Carla", // On remplacera plus tard par le vrai utilisateur
        commentaire,
        cart
      );
  
      clearCart();
      setCommentaire("");
  
      alert("✅ Commande envoyée !");
    } catch (err) {
      console.error(err);
      alert("❌ Impossible d'envoyer la commande.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">
          🛒 Mon panier
        </h2>

        <p className="text-sm text-slate-500">
          {totalItems} article{totalItems > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.length === 0 ? (
          <p className="text-center text-slate-500">
            Le panier est vide.
          </p>
        ) : (
          cart.map((item) => (
            <div
              key={item.article}
              className="rounded-xl border p-4"
            >
              <h3 className="font-medium">
                {item.article}
              </h3>

              <p className="text-sm text-slate-500">
                {item.famille}
              </p>

              <div className="mt-3 flex items-center justify-between">

                <div className="flex items-center gap-2">

                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Commentaire..."
                  className="w-full rounded-lg border p-3"
                />

                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => decreaseQuantity(item.article)}
                  >
                    <Minus />
                  </Button>

                  <span className="w-8 text-center">
                    {item.quantite}
                  </span>

                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => increaseQuantity(item.article)}
                  >
                    <Plus />
                  </Button>

                </div>

                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => removeFromCart(item.article)}
                >
                  <Trash2 />
                </Button>

              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t p-4 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={clearCart}
          >
            Vider le panier
          </Button>

          <Button
          className="w-full"
          onClick={handleCommande}
          disabled={loading}
        >
          {loading ? "Envoi..." : "Envoyer la commande"}
        </Button>
        </div>
      )}
    </div>
  );
}