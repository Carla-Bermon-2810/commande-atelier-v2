"use client";

import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cartItemKey, type CartItem as CartArticle, useCart } from "@/context/cart-context";

interface Props {
  article: CartArticle;
  unite?: string | null;
  referenceMetier?: string | null;
}

const MAX_QUANTITE = 10_000;

function libelleUniteStock(article: CartArticle) {
  if (article.unite) return article.unite;
  const reference = article.stockReference;
  if (!reference) return null;
  if (reference.uniteCommande === "barre") {
    return reference.longueurParBarreMm
      ? `Barre de ${reference.longueurParBarreMm.toLocaleString("fr-FR")} mm`
      : "Longueur à confirmer à la réception";
  }
  if (reference.uniteCommande === "boite") {
    return `Boîte de ${reference.facteurConversion.toLocaleString("fr-FR")} pièce${reference.facteurConversion > 1 ? "s" : ""}`;
  }
  return "Pièce";
}

export default function CartItem({ article, unite, referenceMetier }: Props) {
  const { increaseQuantity, decreaseQuantity, updateQuantity, removeFromCart } = useCart();
  const [imageIndisponible, setImageIndisponible] = useState(false);
  const uniteVisible = unite ?? libelleUniteStock(article) ?? "Unité non renseignée";

  function changerQuantite(valeur: string) {
    const quantite = Number(valeur);

    if (!Number.isInteger(quantite)) return;

    updateQuantity(article, Math.min(MAX_QUANTITE, Math.max(1, quantite)));
  }

  return (
    <article className="border-b border-slate-100 bg-white px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-[#F8F9FA] sm:h-18 sm:w-18">
          {article.photo && !imageIndisponible ? (
            // Les photos peuvent provenir de Supabase ou d'une URL historique,
            // sans domaine fixe configuré pour next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.photo}
              alt=""
              onError={() => setImageIndisponible(true)}
              className="max-h-full max-w-full object-contain p-1"
            />
          ) : (
            <ImageOff className="text-slate-300" size={26} aria-label="Image indisponible" />
          )}
        </div>

        <div className="min-w-[155px] flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{article.famille}</p>
          <h2 className="mt-1 text-sm font-bold text-[#17232b] sm:text-base">{article.article}</h2>
          {article.variante && !article.variante.startsWith("Commande stock ·") && <p className="mt-1 text-sm text-slate-600">{article.variante}</p>}
          <p className={`mt-1 text-sm ${uniteVisible === "Unité non renseignée" || uniteVisible === "Unité non précisée" ? "text-slate-500" : "font-semibold text-slate-700"}`}>{uniteVisible === "Unité non précisée" ? "Unité non renseignée" : uniteVisible}</p>
          {(referenceMetier ?? article.referenceMetier ?? article.stockReference?.referenceKey) && <p className="mt-1 text-xs text-slate-500">Réf. {referenceMetier ?? article.referenceMetier ?? article.stockReference?.referenceKey}</p>}
        </div>

        <div className="ml-auto flex flex-col items-end gap-1 sm:ml-0">
          <span className="text-xs font-semibold text-slate-500">Quantité</span>
          <label htmlFor={`quantite-${cartItemKey(article)}`} className="sr-only">Quantité</label>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => decreaseQuantity(article)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-l-xl bg-white text-slate-700 hover:text-[#F95516]"
              aria-label={`Retirer une unité de ${article.article}`}
            >
              <Minus size={20} />
            </button>
            <input
              id={`quantite-${cartItemKey(article)}`}
              type="number"
              inputMode="numeric"
              min="1"
              max={MAX_QUANTITE}
              value={article.quantite}
              onChange={(event) => changerQuantite(event.target.value)}
              className="min-h-11 w-12 border-x border-slate-200 bg-white px-1 text-center text-sm font-bold text-[#2F3437] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => increaseQuantity(article)}
              disabled={article.quantite >= MAX_QUANTITE}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-r-xl bg-white text-slate-700 hover:text-[#F95516] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Ajouter une unité à ${article.article}`}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeFromCart(article)}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"
          aria-label={`Retirer ${article.article} du panier`}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </article>
  );
}
