"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import ProductCard from "@/components/catalogue/ProductCard";
import { variantLabel, type ProductVariant } from "@/components/catalogue/product-variants";

export type FamilyProduct = {
  produit: string;
  famille: string;
  photo?: string | null;
  variants: ProductVariant[];
};

export default function FamilyProductGrid({ produits }: { produits: FamilyProduct[] }) {
  const [recherche, setRecherche] = useState("");
  const rechercheNormalisee = recherche.trim().toLocaleLowerCase("fr");

  const produitsFiltres = useMemo(() => {
    if (!rechercheNormalisee) return produits;

    return produits.filter((produit) =>
      [produit.produit, ...produit.variants.map(variantLabel)]
        .filter((valeur): valeur is string => Boolean(valeur))
        .some((valeur) => valeur.toLocaleLowerCase("fr").includes(rechercheNormalisee))
    );
  }, [produits, rechercheNormalisee]);

  return (
    <>
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <label htmlFor="recherche-produit" className="sr-only">Rechercher un produit dans cette famille</label>
        <div className="flex items-center gap-3">
          <Search className="shrink-0 text-slate-400" size={20} aria-hidden="true" />
          <input
            id="recherche-produit"
            type="search"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher un produit, un diamètre, une dimension ou un grain…"
            className="min-h-12 w-full bg-transparent text-base text-[#2F3437] outline-none placeholder:text-slate-400"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#F95516]"
              aria-label="Effacer la recherche"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {recherche && <p className="mb-4 text-sm font-medium text-slate-500">{produitsFiltres.length} résultat{produitsFiltres.length > 1 ? "s" : ""}</p>}

      {produitsFiltres.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produitsFiltres.map((produit) => <ProductCard key={produit.produit} produit={produit} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Search className="mx-auto text-slate-300" size={42} aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-[#2F3437]">Aucun produit ne correspond à votre recherche.</h2>
          <p className="mt-2 text-slate-500">Essayez un autre produit, diamètre, dimension ou grain.</p>
          <button type="button" onClick={() => setRecherche("")} className="mt-5 min-h-12 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:border-[#F95516] hover:text-[#F95516]">Effacer la recherche</button>
        </div>
      )}
    </>
  );
}
