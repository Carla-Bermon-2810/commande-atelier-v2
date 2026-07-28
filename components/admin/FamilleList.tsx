"use client";

type Props = {
  familles: any[];
  familleSelectionnee: any;
  onSelect: (famille: any) => void;
  onNew: () => void;
};

export default function FamilleList({
  familles,
  familleSelectionnee,
  onSelect,
  onNew,
}: Props) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">

      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-bold">
          Familles
        </h2>

        <button
          onClick={onNew}
          className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        >
          + Nouvelle
        </button>
      </div>

      <div className="max-h-[700px] overflow-y-auto">

        {familles.map((f) => (

          <button
            key={f.id}
            onClick={() => onSelect(f)}
            className={`w-full border-b p-4 text-left transition hover:bg-gray-100 ${
              familleSelectionnee?.id === f.id
                ? "bg-blue-50 font-semibold"
                : ""
            }`}
          >

            <div className="font-medium">
              {f.famille}
            </div>

            <div className="text-sm text-gray-500">
              {f.categorie}
            </div>

          </button>

        ))}

      </div>

    </div>
  );
}