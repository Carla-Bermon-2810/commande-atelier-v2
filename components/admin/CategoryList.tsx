"use client";

type Props = {
  categories: any[];
  categorieSelectionnee: any;
  onSelect: (categorie: any) => void;
  onNew: () => void;
};

export default function CategoryList({
  categories,
  categorieSelectionnee,
  onSelect,
  onNew,
}: Props) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-bold">Catégories</h2>

        <button
          onClick={onNew}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        >
          + Nouvelle
        </button>
      </div>

      <div className="max-h-[650px] overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className={`w-full border-b p-4 text-left transition hover:bg-gray-100 ${
              categorieSelectionnee?.id === cat.id
                ? "bg-blue-50 font-semibold"
                : ""
            }`}
          >
            {cat.nom}
          </button>
        ))}
      </div>
    </div>
  );
}