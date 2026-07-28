"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/context/cart-context";

export default function PanierPage() {
  const {
    cart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  const [demandeur, setDemandeur] = useState("");
  const [commentaire, setCommentaire] = useState("");

  async function envoyerCommande() {
    if (!demandeur.trim()) {
      alert("Veuillez saisir le nom du demandeur.");
      return;
    }
  
    if (cart.length === 0) {
      alert("Le panier est vide.");
      return;
    }
  
    try {
      const response = await fetch("/api/send-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          demandeur,
          commentaire,
          articles: cart,
        }),
      });
  
      const result = await response.json();
  
      console.log("Réponse API :", result);
  
      if (!response.ok) {
        alert(result.error || result.message || "Erreur inconnue");
        return;
      }
  
      alert("✅ Commande envoyée avec succès !");
  
      clearCart();
      setCommentaire("");
      setDemandeur("");
  
    } catch (error) {
      console.error(error);
      alert("❌ Erreur de connexion au serveur.");
    }
  } //<--fermeture de envoyer commande()  

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl">
        <Navbar />

        <h1 className="mb-8 text-4xl font-bold">
          🛒 Mon panier
        </h1>

        {cart.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <p className="text-xl text-gray-500">
              Votre panier est vide.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((article) => (
                <div
                  key={article.article}
                  className="rounded-xl bg-white p-5 shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        {article.article}
                      </h2>

                      <p className="text-sm text-gray-500">
                        {article.famille}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(article.article)}
                      className="rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <button
                      onClick={() => decreaseQuantity(article.article)}
                      className="h-10 w-10 rounded-lg bg-gray-200 text-xl hover:bg-gray-300"
                    >
                      −
                    </button>

                    <span className="min-w-[30px] text-center text-xl font-bold">
                      {article.quantite}
                    </span>

                    <button
                      onClick={() => increaseQuantity(article.article)}
                      className="h-10 w-10 rounded-lg bg-blue-600 text-xl text-white hover:bg-blue-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-white p-6 shadow">
              <h2 className="mb-4 text-2xl font-bold">
                Informations de la commande
              </h2>

              <label className="mb-2 block font-medium">
                Demandeur
              </label>

              <input
                type="text"
                value={demandeur}
                onChange={(e) => setDemandeur(e.target.value)}
                placeholder="Votre nom"
                className="mb-6 w-full rounded-lg border p-3"
              />

              <label className="mb-2 block font-medium">
                Commentaire
              </label>

              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                placeholder="Ex : besoin avant vendredi..."
                className="w-full rounded-lg border p-3"
              />

              <div className="mt-8 flex gap-4">
                <button
                  onClick={clearCart}
                  className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
                >
                  🗑️ Vider le panier
                </button>

                <button
                  onClick={envoyerCommande}
                  className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                >
                  📧 Envoyer la commande
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}