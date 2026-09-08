"use client";

import { useEffect, useState } from "react";
import {
  X,
  ShoppingCart,
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

  useEffect(() => {
    if (open) {
      setGrainSelectionne(produit.grains[0] ?? "");
    }
  }, [open, produit]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
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
          <div className="relative flex flex-col items-center justify-center p-10 text-center">

            {/* En-tête */}
            <div className="w-full">
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

                {/* Nombre de grains uniquement s'il y en a */}
                {produit.grains.length > 0 && (
                  <p className="mt-2 text-sm text-slate-500">
                    {produit.grains.length} grain
                    {produit.grains.length > 1 ? "s" : ""} disponible
                    {produit.grains.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <button
  onClick={onClose}
  className="absolute right-6 top-6 rounded-xl p-2 transition hover:bg-slate-100"
  aria-label="Fermer"
>
  <X />
</button>

            </div>

            {/* Choix du grain uniquement s'il existe */}
            {produit.grains.length > 0 && (
              <div className="mt-6">

                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Choisir le grain
                </p>

                <div className="flex flex-wrap gap-3">

                  {produit.grains.map((grain) => (
                    <button
                      key={grain}
                      type="button"
                      onClick={() => setGrainSelectionne(grain)}
                      className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold transition ${
                        grainSelectionne === grain
                          ? "border-[#F95516] bg-[#F95516] text-white shadow-sm"
                          : "border-slate-200 bg-white shadow-sm hover:border-[#F95516]"
                      }`}
                    >
                      {grain}
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* Ajouter au panier */}
<div
  className={`border-t border-slate-100 pt-6 ${
    produit.grains.length > 0 ? "mt-6" : "mt-8"
  }`}
>
  <p className="mb-6 text-center text-sm text-slate-600">
    Les quantités seront à renseigner directement dans le panier.
  </p>

  <div className="flex justify-end">
    <button
      type="button"
      onClick={() => {
        addToCart({
          article: grainSelectionne
            ? `${produit.produit} ${grainSelectionne}`
            : produit.produit,
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