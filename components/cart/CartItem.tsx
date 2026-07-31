"use client";

import { ShoppingCart, Trash2, Minus, Plus, ImageOff } from "lucide-react";
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

export default function CartItem({ article }: Props) {
  const {
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <div
    className="cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl"
    >

      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">

        {/* Photo */}

        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#F8F9FA]">

          {article.photo ? (
            <img
              src={article.photo}
              alt={article.article}
              className="max-h-24 object-contain"
            />
          ) : (
            <ImageOff className="text-slate-300" size={42} />
          )}

        </div>

        {/* Infos */}

        <div className="flex-1">

          <h2 className="text-lg font-bold uppercase text-[#2F3437]">
            {article.article}
          </h2>

          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-[#626B72]">
            {article.famille}
          </p>

        </div>

        {/* Quantité */}

        <div className="flex w-72 flex-col gap-4 rounded-2xl bg-slate-50 p-4">

        <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Quantité
        </span>

        <div className="flex gap-4 text-sm">

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`mode-${article.article}`}
              value="unite"
            />
            À l'unité
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={`mode-${article.article}`}
              value="boite"
            />
            Par boîte
          </label>

        </div>

        {/* Mode unité */}

        <div>
          <label className="mb-1 block text-sm text-slate-500">
            Nombre d'unités
          </label>

          <input
            type="number"
            className="w-full rounded-xl border p-2"
          />
        </div>

        {/* Mode boîte */}

        <div className="space-y-3">

          <div>

            <label className="mb-1 block text-sm text-slate-500">
              Nombre de boîtes
            </label>

            <input
              type="number"
              className="w-full rounded-xl border p-2"
            />

          </div>

          <div>

            <label className="mb-1 block text-sm text-slate-500">
              1 boîte contient
            </label>

            <input
              type="number"
              className="w-full rounded-xl border p-2"
            />

          </div>

        </div>

        </div>
        {/* Supprimer */}

        <button
          onClick={() => removeFromCart(article.article)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 text-red-500 transition hover:bg-red-500 hover:text-white"
        >
          <Trash2 size={18} />
        </button>

      </div>

    </div>
  );
}