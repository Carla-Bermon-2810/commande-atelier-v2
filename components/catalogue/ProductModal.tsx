"use client";

import { useEffect, useState } from "react";
import { ImageOff, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { variantLabel, type ProductVariant } from "./product-variants";

interface Props {
  open: boolean;
  onClose: () => void;
  produit: {
    produit: string;
    famille: string;
    photo?: string | null;
    variants: ProductVariant[];
  };
}

export default function ProductModal({ open, onClose, produit }: Props) {
  const { addToCart } = useCart();
  const [selection, setSelection] = useState(0);
  const [quantite, setQuantite] = useState(1);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  if (!open) return null;

  const variante = produit.variants[selection] ?? {};
  const libelleVariante = variantLabel(variante);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div onClick={(event) => event.stopPropagation()} className="max-h-[100dvh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl" role="dialog" aria-modal="true" aria-labelledby="titre-produit">
        <div className="grid grid-cols-1 lg:grid-cols-[42%_58%]">
          <div className="flex min-h-48 items-center justify-center border-b border-slate-100 bg-[#f8f9fa] p-5 sm:min-h-64 sm:p-8 lg:min-h-[500px] lg:border-b-0 lg:border-r">
            {produit.photo ? (
              // Les photos de catalogue viennent de chemins Supabase historiques.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={produit.photo} alt={produit.produit} className="max-h-[520px] w-full object-contain" />
            ) : <ImageOff size={90} className="text-slate-300" />}
          </div>

          <div className="relative flex flex-col p-5 sm:p-10">
            <button type="button" onClick={onClose} className="absolute right-5 top-5 flex min-h-12 min-w-12 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F95516]" aria-label="Fermer la fiche produit"><X /></button>
            <div className="pr-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#F95516]">{produit.famille}</p>
              <h2 id="titre-produit" className="mt-2 text-2xl font-bold text-[#2F3437] sm:text-3xl">{produit.produit}</h2>
              <p className="mt-2 text-slate-500">Choisissez la variante à commander.</p>
            </div>

            <div className="mt-7">
              <p className="mb-3 text-sm font-semibold text-slate-700">Format, diamètre ou grain</p>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {produit.variants.map((item, index) => {
                  const label = variantLabel(item);
                  return <button key={`${label}-${index}`} type="button" onClick={() => setSelection(index)} className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selection === index ? "border-[#F95516] bg-orange-50 text-[#C9400E] ring-1 ring-[#F95516]" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}>{label}</button>;
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="mb-4 text-sm text-slate-600">Variante sélectionnée : <strong className="text-[#2F3437]">{libelleVariante}</strong></p>
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-700">Quantité à demander</span>
                <div className="flex items-center rounded-xl border border-slate-200" aria-label="Quantité à demander">
                  <button type="button" onClick={() => setQuantite((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center rounded-l-xl hover:bg-slate-50" aria-label="Diminuer la quantité"><Minus size={17} /></button>
                  <span className="min-w-10 text-center font-semibold" aria-live="polite">{quantite}</span>
                  <button type="button" onClick={() => setQuantite((q) => Math.min(10000, q + 1))} className="flex h-11 w-11 items-center justify-center rounded-r-xl hover:bg-slate-50" aria-label="Augmenter la quantité"><Plus size={17} /></button>
                </div>
              </div>
              <button
                type="button"
                disabled={ajoutEnCours}
                onClick={() => {
                  if (ajoutEnCours) return;
                  setAjoutEnCours(true);
                  addToCart({
                    article: libelleVariante === "Standard" ? produit.produit : `${produit.produit} — ${libelleVariante}`,
                    famille: produit.famille,
                    photo: produit.photo ?? undefined,
                    quantite,
                  });
                  onClose();
                }}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#F95516] px-8 py-3 font-semibold text-white transition hover:bg-[#e04d13] disabled:cursor-not-allowed disabled:opacity-60"
              ><ShoppingCart size={22} />{ajoutEnCours ? "Ajout en cours…" : "Ajouter au panier"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
