"use client";

import { useState } from "react";
import PhotoUploader from "./PhotoUploader";

type Props = {
  article: any;
  categories: any[];
  familles: any[];

  onSave: (data: any) => void;
  onDelete?: () => void;
};

export default function ArticleForm({
  article,
  categories,
  familles,
  onSave,
  onDelete,
}: Props) {
  const [produit, setProduit] = useState(article?.produit ?? "");
  const [categorie, setCategorie] = useState(article?.categorie ?? "");
  const [famille, setFamille] = useState(article?.famille ?? "");
  const [grain, setGrain] = useState(article?.grain ?? "");
  const [dimension, setDimension] = useState(article?.dimension ?? "");
  const [photo, setPhoto] = useState(article?.photo ?? "");
  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">

      <h2 className="mb-8 text-2xl font-bold text-slate-800">
        {article ? "Modifier l'article" : "Nouvel article"}
      </h2>

      <div className="grid gap-16 md:grid-cols-[420px_minmax(500px,1fr)]">

        {/* Photo */}

        <div className="w-full">
          <div className="flex items-center justify-center rounded-2xl border bg-slate-50 p-6">
          {article?.id ? (
  <PhotoUploader
    articleId={article.id}
    photo={photo}
    onUploaded={(nouvellePhoto) => {
      setPhoto(nouvellePhoto);
    }}
  />
) : (
  <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border bg-slate-50 text-center text-slate-500">
    <div className="mb-3 text-5xl">📷</div>
    <p className="font-semibold">
      La photo pourra être ajoutée après la création de l'article.
    </p>
    <p className="mt-2 text-sm">
      Commencez par enregistrer l'article.
    </p>
  </div>
)}
          </div>
        </div>

        {/* Formulaire */}

        <div className="space-y-8">

          <div>
            <label className="mb-2 block font-semibold">
              Produit
            </label>

            <input
              value={produit}
              onChange={(e) => setProduit(e.target.value)}
              className="w-full rounded-xl border px-4 py-4 text-base"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Catégorie
            </label>

            <select
              value={categorie}
              onChange={(e) => {
                setCategorie(e.target.value);
                setFamille("");
              }}
              className="w-full rounded-xl border px-4 py-4 text-base"
            >
              <option value="">Sélectionner...</option>

              {categories.map((cat) => (
                <option key={cat.id} value={cat.nom}>
                  {cat.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Famille
            </label>

            <select
              value={famille}
              onChange={(e) => setFamille(e.target.value)}
              className="w-full rounded-xl border px-4 py-4 text-base"
            >
              <option value="">Sélectionner...</option>

              {familles
  .filter(
    (f) =>
      f.categorie?.trim().toUpperCase() ===
      categorie.trim().toUpperCase()
  )
  .map((f) => (
    <option key={f.id} value={f.famille}>
      {f.famille}
    </option>
  ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Grain
            </label>

            <input
              value={grain}
              onChange={(e) => setGrain(e.target.value)}
              className="w-full rounded-xl border px-4 py-4 text-base"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Dimension
            </label>

            <input
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              className="w-full rounded-xl border px-4 py-4 text-base"
            />
          </div>

          <div className="flex gap-3 pt-4">

            <button
              onClick={() =>
                onSave({
                  produit,
                  categorie,
                  famille,
                  grain,
                  dimension,
                  photo,
                })
              }
              className="flex-1 rounded-xl bg-[#F95516] py-3 font-semibold text-white transition hover:opacity-90"
            >
              💾 Enregistrer
            </button>

            {onDelete && (
              <button
                onClick={onDelete}
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                🗑️
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}