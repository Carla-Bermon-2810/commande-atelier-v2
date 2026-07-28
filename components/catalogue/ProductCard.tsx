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
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-2xl">

      {/* Image */}
      <div className="relative flex h-64 items-center justify-center border-b border-slate-100 bg-[#F8F9FA] p-6">

        {produit.photo ? (
          <img
            src={produit.photo}
            alt={produit.produit}
            className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImageOff size={60} className="text-slate-300" />
        )}

      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col p-6">

        <h2 className="min-h-[60px] text-lg font-bold uppercase leading-snug text-[#2F3437]">
          {produit.produit}
        </h2>

        <div className="mt-5 flex flex-wrap gap-2">

          {produit.dimension && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-[#626B72]">
              {produit.dimension}
            </span>
          )}

          {produit.grain && (
            <span className="rounded-full bg-[#F95516]/10 px-3 py-1 text-xs font-semibold text-[#F95516]">
              {produit.grain}
            </span>
          )}

        </div>

        <div className="mt-auto flex gap-3 pt-8">

          <button
            onClick={() =>
              addToCart({
                article: produit.produit,
                famille: produit.famille,
                photo: produit.photo ?? undefined,
                quantite: 1,
              })
            }
            title="Ajouter au panier"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#626B72] transition-all duration-300 hover:border-[#F95516] hover:bg-[#F95516] hover:text-white"
          >
            <ShoppingCart size={20} />
          </button>

          <button
            onClick={() =>
              router.push(
                `/produit/${encodeURIComponent(produit.produit)}`
              )
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#F95516] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#dd4b13]"
          >
            Voir le produit
            <ArrowRight size={18} />
          </button>

        </div>

      </div>
    </div>
  );
}