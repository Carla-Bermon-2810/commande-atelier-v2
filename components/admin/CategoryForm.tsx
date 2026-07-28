"use client";

type Props = {
  nom: string;
  setNom: (v: string) => void;
  categorieSelectionnee: any;

  onSave: () => void;
  onDelete: () => void;
};

export default function CategoryForm({
  nom,
  setNom,
  categorieSelectionnee,
  onSave,
  onDelete,
}: Props) {
  if (!categorieSelectionnee) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border bg-white text-gray-400">
        Sélectionnez une catégorie
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-8 shadow-sm">
      <div className="mb-6">
        <label className="mb-2 block font-semibold">
          Nom de la catégorie
        </label>

        <input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
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