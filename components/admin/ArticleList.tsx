"use client";

import { supabase } from "@/lib/supabase";

type Props = {
  articles: any[];
  recherche: string;
  setRecherche: (value: string) => void;
  articleSelectionne: any;
  onSelect: (article: any) => void;
  onNouveau: () => void;
};

export default function ArticleList({
  articles,
  recherche,
  setRecherche,
  articleSelectionne,
  onSelect,
  onNouveau,
}: Props) {
  return (
    <div className="flex h-full flex-col">

      {/* Barre de recherche */}

      <input
        type="text"
        placeholder="🔍 Rechercher un article..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="mb-3 rounded-xl border p-3"
      />

      {/* Nouveau */}

      <button
        onClick={onNouveau}
        className="mb-4 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
      >
        ➕ Nouvel article
      </button>

      {/* Liste */}

      <div className="flex-1 overflow-y-auto rounded-xl border bg-white">

        {articles
          .filter((a) =>
            a.produit
              ?.toLowerCase()
              .includes(recherche.toLowerCase())
          )
          .map((a) => (

            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className={`w-full border-b p-4 text-left transition

                ${
                  articleSelectionne?.id === a.id
                    ? "bg-blue-100"
                    : "hover:bg-gray-50"
                }
              `}
            >

              <div className="flex items-center gap-3">

                {/* Photo */}

                <img
                  src={
                    a.photo
                      ? `${supabase.storage
                          .from("photos")
                          .getPublicUrl(a.photo).data.publicUrl}?t=${Date.now()}`
                      : "/placeholder.png"
                  }
                  alt={a.produit}
                  className="h-14 w-14 rounded-lg border object-cover"
                />

                <div className="flex-1">

                  <div className="font-semibold">
                    {a.produit}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {a.categorie}
                  </div>

                  <div className="text-xs text-gray-400">
                    {a.famille}
                  </div>

                </div>

              </div>

            </button>

          ))}

      </div>

    </div>
  );
}