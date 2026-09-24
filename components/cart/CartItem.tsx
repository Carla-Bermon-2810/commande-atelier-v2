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
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#F8F9FA] sm:h-28 sm:w-28">
          {article.photo && !imageIndisponible ? (
            // Les photos peuvent provenir de Supabase ou d'une URL historique,
            // sans domaine fixe configuré pour next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.photo}
              alt=""
              onError={() => setImageIndisponible(true)}
              className="max-h-24 max-w-full object-contain p-2"
            />
          ) : (
            <ImageOff className="text-slate-300" size={42} aria-label="Image indisponible" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold uppercase text-[#2F3437]">{article.article}</h2>
          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-[#626B72]">{article.famille}</p>
        </div>

        <div className="w-full rounded-2xl bg-slate-50 p-4 md:w-auto">
          <label htmlFor={`quantite-${article.article}`} className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-600">Quantité</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decreaseQuantity(article.article)}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:border-[#F95516] hover:text-[#F95516]"
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
              className="min-h-12 w-20 rounded-xl border border-slate-300 bg-white px-2 text-center text-base font-bold text-[#2F3437] focus:border-[#F95516] focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="button"
              onClick={() => increaseQuantity(article.article)}
              disabled={article.quantite >= MAX_QUANTITE}
              className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:border-[#F95516] hover:text-[#F95516] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Ajouter une unité à ${article.article}`}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => removeFromCart(article.article)}
          className="flex min-h-12 min-w-12 items-center justify-center self-end rounded-xl border border-red-200 text-red-600 hover:bg-red-50 md:self-auto"
          aria-label={`Retirer ${article.article} du panier`}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </article>
  );
}
