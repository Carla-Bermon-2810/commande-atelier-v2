"use client";

import { useEffect, useState } from "react";
import {
  X,
  ShoppingCart,
  Minus,
  Plus,
  ImageOff,
} from "lucide-react";
import { useCart } from "@/context/cart-context";

interface Props {
  open: boolean;
  onClose: () => void;
  produit: {
    produit: string;
    famille: string;
    photo?: string | null;
    dimension?: string | null;
    grains: string[];
  };
}

export default function ProductModal({
  open,
  onClose,
  produit,
}: Props) {
  const { addToCart } = useCart();

  const [grainSelectionne, setGrainSelectionne] = useState("");
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    if (open) {
      setGrainSelectionne(produit.grains[0] ?? "");
      setQuantite(1);
    }
  }, [open, produit]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[42%_58%]">

          {/* Photo */}
          <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-12">
            {produit.photo ? (
              <img
                src={produit.photo}
                alt={produit.produit}
                className="max-h-[520px] w-full object-contain transition duration-300 hover:scale-105"
              />
            ) : (
              <ImageOff
                size={90}
                className="text-slate-300"
              />
            )}
          </div>

          {/* Informations */}
          <div className="p-10">

            {/* En-tête */}
            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-3xl font-bold text-[#2F3437]">
                  {produit.produit}
                </h2>

                {produit.dimension && (
                  <p className="mt-2 text-slate-500">
                    Dimension :
                    <strong> {produit.dimension}</strong>
                  </p>
                )}

                <p className="mt-2 text-sm text-slate-500">
                  {produit.grains.length} grain
                  {produit.grains.length > 1 ? "s" : ""} disponible
                  {produit.grains.length > 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-x1 p-2 transition hover:bg-slate-100"
              >
                <X />
              </button>

            </div>

            {/* Choix du grain */}
            <div className="mt-6">

              <p className="mb-3 text-sm font-semibold text-slate-700">
                Choisir le grain
              </p>

              <div className="flex flex-wrap gap-3">

                {produit.grains.map((grain) => (
                  <button
                    key={grain}
                    onClick={() =>
                      setGrainSelectionne(grain)
                    }
                    className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition ${
                      grainSelectionne === grain
                        ? "border-[#F95516] bg-[#F95516] text-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-[#F95516] shadow-sm"
                    }`}
                  >
                    {grain}
                  </button>
                ))}

              </div>

            </div>

{/* Ajouter au panier */}
<div className="mt-6 border-t border-slate-100 pt-6">

  <p className="mb-6 text-center text-sm text-slate-600">
    Les quantités seront à renseigner directement dans le panier.
  </p>

  <div className="flex justify-end">
    <button
      onClick={() => {
        addToCart({
          article: `${produit.produit} ${grainSelectionne}`,
          famille: produit.famille,
          photo: produit.photo ?? undefined,
          quantite: 1,
        });

        onClose();
      }}
      className="flex items-center justify-center gap-3 rounded-2xl bg-[#F95516] px-8 py-3 font-semibold text-white transition hover:bg-[#e04d13]"
    >
      <ShoppingCart size={22} />
      Ajouter au panier
    </button>
  </div>

</div>

        </div> 
      </div>  
    </div>     
  </div>       
);
}