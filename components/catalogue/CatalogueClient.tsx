"use client";

import { useMemo, useState } from "react";
import Hero from "@/components/layout/Hero";
import SearchBar from "@/components/catalogue/SearchBar";
import CategoryCard from "@/components/catalogue/CategoryCard";
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

type ProduitModal = {
  produit: string;
  famille: string;
  photo?: string | null;
  variants: { dimension?: string | null; grain?: string | null }[];
};

type Props = {
  categories: Category[];
  catalogue: Produit[];
};

function getPhotoUrl(photo?: string | null) {
  if (!photo) return null;

  // Si c'est déjà une URL complète, on la garde
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  // Sinon, on transforme le chemin Supabase
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photo}`;
}

export default function CatalogueClient({
  categories,
  catalogue,
}: Props) {
  const [search, setSearch] = useState("");
  const [produitSelectionne, setProduitSelectionne] =
    useState<ProduitModal | null>(null);
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

    const resultats = catalogue.filter((p) =>
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

    // La recherche conserve une seule entrée par produit : les formats,
    // dimensions et grains sont choisis dans la fiche qui s'ouvre ensuite.
    return Array.from(
      new Map(
        resultats.map((produit) => [
          `${produit.categorie.trim().toLowerCase()}|${produit.famille.trim().toLowerCase()}|${produit.produit.trim().toLowerCase()}`,
          produit,
        ])
      ).values()
    );
  }, [catalogue, search]);

  const ouvrirProduit = (produit: Produit) => {
    // Récupère toutes les variantes du même produit
    const variantes = catalogue.filter(
      (p) =>
        p.produit.trim().toLowerCase() === produit.produit.trim().toLowerCase() &&
        p.categorie.trim().toLowerCase() === produit.categorie.trim().toLowerCase() &&
        p.famille.trim().toLowerCase() === produit.famille.trim().toLowerCase()
    );

    // On prend la première photo disponible
    const photo =
      variantes.find((p) => p.photo)?.photo ?? null;

    setProduitSelectionne({
      produit: produit.produit,
      famille: produit.famille,
      photo: getPhotoUrl(photo),
      variants: variantes.map((item) => ({
        dimension: item.dimension,
        grain: item.grain,
      })),
    });

    setModalOuverte(true);
  };

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

              {produitsFiltres.map((produit) => {
                const photoUrl = getPhotoUrl(produit.photo);

                return (
                  <button
                    key={produit.id}
                    type="button"
                    onClick={() => ouvrirProduit(produit)}
                    className="flex w-full items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#F95516] hover:shadow-md"
                  >
                    {/* Photo */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">

                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={produit.produit}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-3xl">
                          📦
                        </span>
                      )}

                    </div>

                    {/* Informations */}
                    <div className="min-w-0 flex-1">

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

                  </button>
                );
              })}

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
