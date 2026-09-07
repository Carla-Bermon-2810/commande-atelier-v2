"use client";

import { useMemo, useState } from "react";
import Hero from "@/components/layout/Hero";
import SearchBar from "@/components/catalogue/SearchBar";
import CategoryCard from "@/components/catalogue/CategoryCard";
import ArticleCard from "@/components/catalogue/ArticleCard";
import ProductModal from "@/components/catalogue/ProductModal";

type Category = {
  id: number;
  nom: string;
  slug: string;
  ordre: number;
};

type Produit = {
  id: number;
  categorie: string;
  famille: string;
  produit: string;
  grain?: string;
  dimension?: string;
  photo?: string;
};

type Props = {
  categories: Category[];
  catalogue: Produit[];
};

export default function CatalogueClient({
  categories,
  catalogue,
}: Props) {
  const [search, setSearch] = useState("");
  const [produitSelectionne, setProduitSelectionne] = useState<any>(null);
  const [modalOuverte, setModalOuverte] = useState(false);

  const articleCount = useMemo(() => {
    const count: Record<string, number> = {};

    catalogue.forEach((article) => {
      const key = article.categorie.toLowerCase().trim();
      count[key] = (count[key] || 0) + 1;
    });

    return count;
  }, [catalogue]);

  const produitsFiltres = useMemo(() => {
    if (!search.trim()) return [];

    const q = search.toLowerCase();

    return catalogue.filter((p) =>
      [
        p.produit,
        p.categorie,
        p.famille,
        p.grain,
        p.dimension,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [catalogue, search]);

  return (
    <>
      <Hero />

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {!search ? (
        <div
          className={`mt-8 grid gap-6 ${
            categories.length <= 4
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {categories.map((categorie) => (
            <CategoryCard
              key={categorie.id}
              icon={categorie.nom.toLowerCase()}
              title={categorie.nom}
              href={`/categorie/${categorie.slug}`}
              count={
                articleCount[
                  categorie.nom.toLowerCase()
                ] ?? 0
              }
            />
          ))}
        </div>
      ) : (
        <div className="mt-8">
      
          <p className="mb-5 text-sm font-medium text-slate-500">
            {produitsFiltres.length} résultat(s)
          </p>
      
          {produitsFiltres.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {produitsFiltres.map((produit) => (
  <button
    key={produit.id}
    onClick={() => {
      const variantes = catalogue.filter(
        (p) => p.produit === produit.produit
      );

      const grains = variantes
        .map((p) => p.grain)
        .filter(Boolean);

      const photo = variantes.find((p) => p.photo)?.photo ?? null;

      setProduitSelectionne({
        produit: produit.produit,
        famille: produit.famille,
        dimension: produit.dimension,
        photo,
        grains,
      });

      setModalOuverte(true);
    }}
    className="flex w-full items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#F95516] hover:shadow-md"
  >
    {/* Photo */}
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      {produit.photo ? (
        <img
          src={produit.photo}
          alt={produit.produit}
          className="h-full w-full object-contain p-2"
        />
      ) : (
        <span className="text-3xl">📦</span>
      )}
    </div>

    {/* Informations */}
    <div className="flex-1">
      <h3 className="text-lg font-bold text-[#2F3437]">
        {produit.produit}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {produit.categorie}
        {" • "}
        {produit.famille}

        {produit.grain &&
          ` • ${produit.grain}`}

        {produit.dimension &&
          ` • ${produit.dimension}`}
      </p>
    </div>

    {/* Indication */}
    <div className="text-sm font-semibold text-[#F95516]">
      Voir →
    </div>
  </button>
))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
              Aucun article trouvé.
            </div>
          )}
      
        </div>
      )}
{produitSelectionne && (
  <ProductModal
    open={modalOuverte}
    onClose={() => {
      setModalOuverte(false);
      setProduitSelectionne(null);
    }}
    produit={produitSelectionne}
  />
)}
    </>
  );
}