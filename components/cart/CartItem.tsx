"use client";

import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/cart-context";

interface CartArticle {
  article: string;
  famille: string;
  photo?: string;
  quantite: number;
}

interface Props {
  article: CartArticle;
}

const MAX_QUANTITE = 10_000;

export default function CartItem({ article }: Props) {
  const { increaseQuantity, decreaseQuantity, updateQuantity, removeFromCart } = useCart();
  const [imageIndisponible, setImageIndisponible] = useState(false);

  function changerQuantite(valeur: string) {
    const quantite = Number(valeur);

    if (!Number.isInteger(quantite)) return;

    updateQuantity(article.article, Math.min(MAX_QUANTITE, Math.max(1, quantite)));
  }

  return (
    <article className="border-b border-slate-100 bg-white last:border-b-0">
      <div className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4 sm:p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA] sm:h-16 sm:w-16">
          {article.photo && !imageIndisponible ? (
            // Les photos peuvent provenir de Supabase ou d'une URL historique,
            // sans domaine fixe configuré pour next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.photo}
              alt=""
              onError={() => setImageIndisponible(true)}
              className="max-h-14 max-w-full object-contain p-1 sm:max-h-16"
            />
          ) : (
            <ImageOff className="text-slate-300" size={26} aria-label="Image indisponible" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[#17232b] sm:text-base">{article.article}</h2>
          <p className="mt-1 text-xs text-slate-500">{article.famille}</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <label htmlFor={`quantite-${article.article}`} className="sr-only">Quantité</label>
          <div className="flex items-center rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => decreaseQuantity(article.article)}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-l-lg bg-white text-slate-700 hover:text-[#F95516]"
              aria-label={`Retirer une unité de ${article.article}`}
            >
              <Minus size={20} />
            </button>
            <input
              id={`quantite-${article.article}`}
              type="number"
              inputMode="numeric"
              min="1"
              max={MAX_QUANTITE}
              value={article.quantite}
              onChange={(event) => changerQuantite(event.target.value)}
              className="min-h-10 w-12 border-x border-slate-200 bg-white px-1 text-center text-sm font-bold text-[#2F3437] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => increaseQuantity(article.article)}
              disabled={article.quantite >= MAX_QUANTITE}
              className="flex min-h-10 min-w-10 items-center justify-center rounded-r-lg bg-white text-slate-700 hover:text-[#F95516] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Ajouter une unité à ${article.article}`}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeFromCart(article.article)}
          className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
          aria-label={`Retirer ${article.article} du panier`}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </article>
  );
}
