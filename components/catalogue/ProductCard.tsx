"use client";

import { useState } from "react";
import { ImageOff, Ruler } from "lucide-react";
import ProductModal from "./ProductModal";

interface Props {
  produit: {
    produit: string;
    famille: string;
    photo?: string | null;
    dimension?: string | null;
    grains: string[];
  };
}

export default function ProductCard({ produit }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-2xl"
      >
        {/* Image */}
        <div className="relative flex h-72 items-center justify-center border-b border-slate-100 bg-[#F8F9FA] p-4">
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
<div className="flex flex-1 flex-col p-5">

{/* Titre */}
<h2 className="min-h-[56px] text-xl font-bold uppercase leading-snug text-[#2F3437]">
  {produit.produit}
</h2>

{/* Dimension */}
{produit.dimension && (
  <div className="mt-3 mb-5 inline-flex w-fit items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
    <Ruler className="h-4 w-4 text-slate-500" />
    <span>{produit.dimension}</span>
  </div>
)}

{/* Grains */}
{produit.grains.some((grain) => grain?.trim()) && (
  <div>
    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
      Grains disponibles
    </p>

    <div className="flex flex-wrap gap-2">
      {produit.grains
        .filter((grain) => grain?.trim())
        .sort()
        .slice(0, 4)
        .map((grain) => (
          <span
            key={grain}
            className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#F95516]"
          >
            {grain}
          </span>
        ))}

      {produit.grains.filter((grain) => grain?.trim()).length > 4 && (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          +{produit.grains.filter((grain) => grain?.trim()).length - 4}
        </span>
      )}
    </div>
  </div>
)}
</div>
      </div>

      <ProductModal
        open={open}
        onClose={() => setOpen(false)}
        produit={produit}
      />
    </>
  );
}