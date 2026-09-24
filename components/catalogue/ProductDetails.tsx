"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, ImageOff } from "lucide-react";
import { useCart } from "@/context/cart-context";

interface Props {
  produit: {
    produit: string;
    famille: string;
    photo?: string | null;
    dimension?: string | null;
    grains: string[];
  };
}

export default function ProductDetails({ produit }: Props) {
  const { addToCart } = useCart();

  const [grainSelectionne, setGrainSelectionne] = useState(
    produit.grains[0] ?? ""
  );

  const [quantite, setQuantite] = useState(1);

  function ajouterAuPanier() {
    addToCart({
      article: `${produit.produit} ${grainSelectionne}`.trim(),
      famille: produit.famille,
      photo: produit.photo ?? undefined,
      quantite,
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[50%_50%]">

        {/* PHOTO */}
        <div className="flex min-h-64 items-center justify-center border-b border-slate-100 bg-[#F8F9FA] p-6 lg:min-h-[500px] lg:border-b-0 lg:border-r lg:p-10">
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

        {/* INFORMATIONS */}
        <div className="p-5 sm:p-8">

          <h1 className="text-2xl font-bold text-[#17232b] sm:text-3xl">
            {produit.produit}
          </h1>

          <p className="mt-2 text-slate-500">
            Famille : <strong>{produit.famille}</strong>
          </p>

          {produit.dimension && (
            <p className="mt-2 text-slate-500">
              Dimension :{" "}
              <strong>{produit.dimension}</strong>
            </p>
          )}

          {/* GRAIN */}
          {produit.grains.length > 0 && (
            <div className="mt-8">
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
                        ? "border-[#F95516] bg-orange-50 text-[#F95516] shadow-sm"
                        : "border-slate-200 bg-white shadow-sm hover:border-[#F95516]"
                    }`}
                  >
                    {grain}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUANTITÉ */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Quantité
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setQuantite((q) => Math.max(1, q - 1))
                }
                className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-100"
              >
                <Minus size={18} />
              </button>

              <span className="min-w-[40px] text-center text-xl font-bold">
                {quantite}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantite((q) => q + 1)
                }
                className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-100"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* PANIER */}
          <div className="mt-8">
            <button
              type="button"
              onClick={ajouterAuPanier}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F95516] py-4 font-semibold text-white transition hover:bg-[#e04d13]"
            >
              <ShoppingCart size={22} />
              Ajouter au panier
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
