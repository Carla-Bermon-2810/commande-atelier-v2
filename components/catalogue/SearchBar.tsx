"use client";

import { Search, ScanSearch } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-xl">

        {/* Icône */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F95516]/10">
          <Search
            className="h-6 w-6 text-[#F95516]"
            strokeWidth={2.2}
          />
        </div>

        {/* Champ */}
        <input
          type="text"
          placeholder="Rechercher un produit, une référence ou une famille..."
          className="flex-1 border-none bg-transparent text-lg text-[#2F3437] outline-none placeholder:text-slate-400"
        />

        {/* Bouton */}
        <button
          className="
            flex items-center gap-2
            rounded-2xl
            bg-[#F95516]
            px-7
            py-4
            font-semibold
            text-white
            transition-all
            duration-300
            hover:scale-[1.02]
            hover:bg-[#dd4b13]
            active:scale-95
          "
        >
          <ScanSearch size={20} />
          Rechercher
        </button>

      </div>
    </div>
  );
}