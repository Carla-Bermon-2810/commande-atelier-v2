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
    <div className="mx-auto mt-6 w-full max-w-none">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-lg shadow-slate-200/40 transition-all duration-300 focus-within:border-[#f15a24] focus-within:ring-2 focus-within:ring-[#f15a24]/20 sm:gap-4 sm:p-3">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f15a24]/10 sm:h-14 sm:w-14 sm:rounded-2xl">
          <Search
            className="h-6 w-6 text-[#f15a24]"
            strokeWidth={2.2}
          />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher un produit, une famille, un grain ou une dimension..."
          className="min-w-0 flex-1 bg-transparent text-base text-[#2F3437] outline-none placeholder:text-slate-400 sm:text-lg"
        />

        <span className="hidden min-h-12 items-center rounded-xl bg-[#f15a24] px-5 text-sm font-bold text-white shadow-sm lg:inline-flex">Rechercher</span>

      </div>
    </div>
  );
}
