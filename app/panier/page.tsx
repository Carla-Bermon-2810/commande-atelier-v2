"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/context/cart-context";
import CartItem from "@/components/cart/CartItem";

export default function PanierPage() {
  const {
    cart,
    clearCart,
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
            <div className="mt-8 grid gap-8 lg:grid-cols-3">

              {/* Liste des articles */}
              <div className="space-y-4 lg:col-span-2">
                {cart.map((article) => (
                  <CartItem
                    key={article.article}
                    article={article}
                  />
                ))}
              </div>

              {/* Résumé */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
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

                <div className="mt-8 space-y-3">
                <button
                onClick={clearCart}
                className="w-full rounded-xl border border-red-600 bg-white py-3 font-semibold text-red-600 transition hover:bg-red-50"
              >
                🗑️ Vider le panier
              </button>

              <button
                onClick={envoyerCommande}
                className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                📧 Envoyer la commande
              </button>
              </div>
            </div> {/* fin du résumé */}

          </div> {/* fin du grid */}
        </>
        )}
      </div>
    </main>
  );
}