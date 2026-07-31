"use client";

import { useRouter } from "next/navigation";

type Props = {
  articles: any[];
  categories: any[];
  familles: any[];

  recherche: string;
  setRecherche: (value: string) => void;

  filtreCategorie: string;
  setFiltreCategorie: (value: string) => void;

  filtreFamille: string;
  setFiltreFamille: (value: string) => void;
  
};

export default function ArticleList({
  articles,
  categories,
  familles,
  recherche,
  setRecherche,
  filtreCategorie,
  setFiltreCategorie,
  filtreFamille,
  setFiltreFamille,
}: Props) {
  const router = useRouter();
  const famillesFiltrees = familles.filter(
    (f) =>
      !filtreCategorie ||
      f.categorie?.trim().toLowerCase() ===
        filtreCategorie.trim().toLowerCase()
  );
  
  return (
    <div className="flex h-full flex-col rounded-xl border bg-white">
  
      {/* Zone fixe */}
      <div className="border-b p-5">
  
        {/* Recherche */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Rechercher un article..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-[#F95516] focus:outline-none"
          />
        </div>
  
        {/* Nouveau */}
        <button
          onClick={() => router.push("/admin/articles/nouveau")}
          className="w-full rounded-xl bg-[#F95516] py-3 font-semibold text-white transition hover:opacity-90"
        >
          ➕ Nouvel article
        </button>
  
      </div>
  
      {/* Zone qui défile */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Catégories */}
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Catégories
          </h3>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() => {
                setFiltreCategorie("");
                setFiltreFamille("");
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filtreCategorie === ""
                  ? "bg-[#F95516] text-white"
                  : "border bg-white hover:bg-gray-100"
              }`}
            >
              Toutes
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setFiltreCategorie(cat.nom);
                  setFiltreFamille("");
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filtreCategorie === cat.nom
                    ? "bg-[#F95516] text-white"
                    : "border bg-white hover:bg-gray-100"
                }`}
              >
                {cat.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Familles */}
        {filtreCategorie && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Familles
          </h3>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() => setFiltreFamille("")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filtreFamille === ""
                  ? "bg-[#F95516] text-white"
                  : "border bg-white hover:bg-gray-100"
              }`}
            >
              Toutes
            </button>

            {famillesFiltrees.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltreFamille(f.famille)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filtreFamille === f.famille
                    ? "bg-[#F95516] text-white"
                    : "border bg-white hover:bg-gray-100"
                }`}
              >
                  {f.famille}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}