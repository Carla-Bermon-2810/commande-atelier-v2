"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="mx-auto mt-4 w-full max-w-none">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-all duration-300 focus-within:border-[#F95516] focus-within:ring-2 focus-within:ring-[#F95516]/20 sm:gap-4 sm:p-2.5">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-11 sm:w-11">
          <Search
            className="h-5 w-5 text-[#142026]"
            strokeWidth={2.2}
          />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher un produit, une famille, un grain ou une dimension..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[#2F3437] outline-none placeholder:text-slate-400 sm:text-base"
        />

        <span className="hidden min-h-11 items-center rounded-lg bg-[#F95516] px-5 text-sm font-bold text-white shadow-sm lg:inline-flex">Rechercher</span>

      </div>
    </div>
  );
}
