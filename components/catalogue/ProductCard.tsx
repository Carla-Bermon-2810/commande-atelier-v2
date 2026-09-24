"use client";

import { useState } from "react";
import { ImageOff, Layers } from "lucide-react";
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
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-[0_1px_2px_rgba(30,41,59,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_14px_28px_rgba(30,41,59,0.10)] focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"
        aria-haspopup="dialog"
        aria-label={`Voir les variantes de ${produit.produit}`}
      >
        <div className="relative flex h-48 items-center justify-center border-b border-slate-100 bg-[#F8F9FA] p-4 sm:h-60 lg:h-64">
          {produit.photo ? (
            // Les photos de catalogue peuvent être hébergées sur Supabase ou une URL historique.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={produit.photo} alt={produit.produit} className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <ImageOff size={60} className="text-slate-300" />
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <h2 className="min-h-[48px] text-lg font-bold uppercase leading-snug text-[#2F3437]">{produit.produit}</h2>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.08em] text-slate-400">
              <Layers size={14} /> {apercus.length} variante{apercus.length > 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {apercus.slice(0, 3).map((apercu) => (
                <span key={apercu} className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#F95516]">{apercu}</span>
              ))}
              {apercus.length > 3 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">+{apercus.length - 3}</span>}
            </div>
          </div>
        </div>
      </button>

      <ProductModal key={produit.produit} open={open} onClose={() => setOpen(false)} produit={produit} />
    </>
  );
}
