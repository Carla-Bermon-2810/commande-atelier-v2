"use client";

type Props = {
  famille: string;
  setFamille: (v: string) => void;

  categorie: string;
  setCategorie: (v: string) => void;

  ordre: number;
  setOrdre: (v: number) => void;

  categories: any[];

  familleSelectionnee: any;

  onSave: () => void;
  onDelete: () => void;
};

export default function FamilleForm({
  famille,
  setFamille,
  categorie,
  setCategorie,
  ordre,
  setOrdre,
  categories,
  familleSelectionnee,
  onSave,
  onDelete,
}: Props) {
  if (!familleSelectionnee) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-white text-gray-400">
        Sélectionnez une famille
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-8 shadow-sm">
      <div className="mb-5">
        <label className="mb-2 block font-semibold">
          Famille
        </label>

        <input
          value={famille}
          onChange={(e) => setFamille(e.target.value)}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="mb-5">
        <label className="mb-2 block font-semibold">
          Catégorie
        </label>

        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="w-full rounded-lg border p-3"
        >
          <option value="">Sélectionner...</option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.nom}>
              {cat.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8">
        <label className="mb-2 block font-semibold">
          Ordre
        </label>

        <input
          type="number"
          value={ordre}
          onChange={(e) => setOrdre(Number(e.target.value))}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
        >
          💾 Enregistrer
        </button>

        <button
          onClick={onDelete}
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}