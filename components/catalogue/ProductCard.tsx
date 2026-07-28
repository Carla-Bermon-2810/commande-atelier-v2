"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import {
  ArrowRight,
  ImageOff,
  ShoppingCart,
} from "lucide-react";

interface Props {
  produit: {
    produit: string;
    famille: string;
    photo?: string | null;
    dimension?: string | null;
    grain?: string | null;
  };
}

export default function ProductCard({ produit }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();

  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl">

      {/* Image */}

      <div className="flex h-60 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">

        {produit.photo ? (
          <img
            src={produit.photo}
            alt={produit.produit}
            className="max-h-full object-contain transition duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageOff
            size={64}
            className="text-slate-300"
          />
        )}

      </div>

      {/* Contenu */}

      <div className="space-y-4 p-6">

        <h2 className="min-h-[56px] text-lg font-semibold text-slate-800">
          {produit.produit}
        </h2>

        {/* Badges */}

        <div className="flex flex-wrap gap-2">

          {produit.dimension && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {produit.dimension}
            </span>
          )}

          {produit.grain && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              {produit.grain}
            </span>
          )}

        </div>

        {/* Boutons */}

        <div className="flex gap-3 pt-2">

          <button
            onClick={() =>
            addToCart({
              article: produit.produit,
              famille: produit.famille,
              photo: produit.photo ?? undefined,
              quantite: 1,
            })
          }
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 transition hover:bg-blue-50 hover:border-blue-500"
          title="Ajouter au panier"
>
  <ShoppingCart size={18} />
</button>

          <button
            onClick={() =>
              router.push(
                `/produit/${encodeURIComponent(produit.produit)}`
              )
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Voir le produit
            <ArrowRight size={18} />
          </button>

        </div>

      </div>
    </div>
  );
}