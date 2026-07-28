"use client";

import { Search, ScanSearch } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-3 py-3 shadow-lg shadow-blue-100/30">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Search className="h-6 w-6 text-blue-600" />
        </div>

        <input
          type="text"
          placeholder="Rechercher un produit, une référence ou une famille..."
          className="flex-1 bg-transparent px-5 text-lg outline-none placeholder:text-gray-400"
        />

        <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700">
          <ScanSearch className="h-5 w-5" />
          Rechercher
        </button>

      </div>
    </div>
  );
}