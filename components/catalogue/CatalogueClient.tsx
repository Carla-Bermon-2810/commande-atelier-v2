"use client";

import { useMemo, useState } from "react";
import Hero from "@/components/layout/Hero";
import SearchBar from "@/components/catalogue/SearchBar";
import CategoryCard from "@/components/catalogue/CategoryCard";

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
        <div className="mt-8 space-y-3">

          <p className="text-sm font-medium text-slate-500">
            {produitsFiltres.length} résultat(s)
          </p>

          {produitsFiltres.map((produit) => (
            <div
              key={produit.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#F95516]"
            >
              <div>

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

            </div>
          ))}
        </div>
      )}
    </>
  );
}