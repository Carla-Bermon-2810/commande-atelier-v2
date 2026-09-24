"use client";

import { useState } from "react";
import { ArrowRight, ImageOff, Layers } from "lucide-react";
import ProductModal from "./ProductModal";
import { variantLabel, type ProductVariant } from "./product-variants";

interface Props {
  produit: {
    produit: string;
    famille: string;
    photo?: string | null;
    variants: ProductVariant[];
  };
}

export default function ProductCard({ produit }: Props) {
  const [open, setOpen] = useState(false);
  const apercus = produit.variants.map(variantLabel);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F95516] hover:shadow-[0_14px_28px_rgba(30,41,59,0.10)] focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"
        aria-haspopup="dialog"
        aria-label={`Voir les variantes de ${produit.produit}`}
      >
        <div className="relative flex h-40 items-center justify-center border-b border-slate-100 bg-[#F8F9FA] p-4 sm:h-44 lg:h-48">
          {produit.photo ? (
            // Les photos de catalogue peuvent être hébergées sur Supabase ou une URL historique.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={produit.photo} alt={produit.produit} className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <ImageOff size={60} className="text-slate-300" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h2 className="min-h-10 text-sm font-bold leading-snug text-[#17232b] sm:text-base">{produit.produit}</h2>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Layers size={14} /> {apercus.length} variante{apercus.length > 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {apercus.slice(0, 3).map((apercu) => (
                <span key={apercu} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">{apercu}</span>
              ))}
              {apercus.length > 3 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">+{apercus.length - 3}</span>}
            </div>
          </div>
          <span className="mt-auto flex items-center justify-between pt-3 text-xs font-bold text-[#F95516]">Choisir une variante <ArrowRight size={16} /></span>
        </div>
      </button>

      <ProductModal key={produit.produit} open={open} onClose={() => setOpen(false)} produit={produit} />
    </>
  );
}
