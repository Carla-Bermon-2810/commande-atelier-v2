"use client";

import PhotoUploader from "./PhotoUploader";

type Props = {
  produit: string;
  setProduit: (v: string) => void;

  categorie: string;
  setCategorie: (v: string) => void;

  famille: string;
  setFamille: (v: string) => void;

  grain: string;
  setGrain: (v: string) => void;

  dimension: string;
  setDimension: (v: string) => void;

  categories: any[];
  familles: any[];

  articleSelectionne: any;

  onSave: () => void;
  onDelete: () => void;
};

export default function ArticleForm({
  produit,
  setProduit,

  categorie,
  setCategorie,

  famille,
  setFamille,

  grain,
  setGrain,

  dimension,
  setDimension,

  categories,
  familles,

  articleSelectionne,

  onSave,
  onDelete,
}: Props) {
  
  if (!articleSelectionne) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-white text-gray-400">
        Sélectionnez un article
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-8 shadow-sm">

      {/* Photo */}

      <div className="mb-8 flex justify-center">

  <PhotoUploader
    articleId={articleSelectionne.id}
    photo={articleSelectionne.photo}
    onUploaded={(photo) => {
      articleSelectionne.photo = photo;
    }}
  />

</div>

      {/* Produit */}

      <div className="mb-5">

        <label className="mb-2 block font-semibold">
          Produit
        </label>

        <input
          value={produit}
          onChange={(e) => setProduit(e.target.value)}
          className="w-full rounded-lg border p-3"
        />

      </div>

      {/* Catégorie */}

      <div className="mb-5">

        <label className="mb-2 block font-semibold">
          Catégorie
        </label>

        <select
          value={categorie}
          onChange={(e) => {
            setCategorie(e.target.value);
            setFamille("");
          }}
          className="w-full rounded-lg border p-3"
        >

          <option value="">
            Sélectionner...
          </option>

          {categories.map((cat) => (
            <option
              key={cat.id}
              value={cat.nom}
            >
              {cat.nom}
            </option>
          ))}

        </select>

      </div>

      {/* Famille */}

      <div className="mb-5">

        <label className="mb-2 block font-semibold">
          Famille
        </label>

        <select
          value={famille}
          onChange={(e) => setFamille(e.target.value)}
          className="w-full rounded-lg border p-3"
        >

          <option value="">
            Sélectionner...
          </option>

          {familles
            .filter((f) => f.categorie === categorie)
            .map((f) => (
              <option
                key={f.id}
                value={f.famille}
              >
                {f.famille}
              </option>
            ))}

        </select>

      </div>

      {/* Grain */}

      {grain !== "" && (

        <div className="mb-5">

          <label className="mb-2 block font-semibold">
            Grain
          </label>

          <input
            value={grain}
            onChange={(e) => setGrain(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

        </div>

      )}

      {/* Dimension */}

      {dimension !== "" && (

        <div className="mb-8">

          <label className="mb-2 block font-semibold">
            Dimension
          </label>

          <input
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

        </div>

      )}

      {/* Boutons */}

      <div className="flex gap-3">

        <button
          onClick={onSave}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          💾 Enregistrer
        </button>

        <button
          onClick={onDelete}
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          🗑️
        </button>

      </div>

    </div>
  );
}