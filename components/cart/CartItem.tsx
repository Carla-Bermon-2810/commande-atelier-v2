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
    removeFromCart,
  } = useCart();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-[#F95516] hover:shadow-xl">

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

        <div className="flex items-center gap-3">

          <button
            onClick={() => decreaseQuantity(article.article)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 hover:border-[#F95516] hover:text-[#F95516]"
          >
            <Minus size={18} />
          </button>

          <span className="min-w-[35px] text-center text-xl font-bold">
            {article.quantite}
          </span>

          <button
            onClick={() => increaseQuantity(article.article)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F95516] text-white hover:bg-[#dd4b13]"
          >
            <Plus size={18} />
          </button>

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