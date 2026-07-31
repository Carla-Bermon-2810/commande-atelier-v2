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
    <div className="mx-auto mt-6 w-full max-w-4xl">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/40 transition-all duration-300 focus-within:border-[#F95516] focus-within:ring-2 focus-within:ring-[#F95516]/20">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F95516]/10">
          <Search
            className="h-6 w-6 text-[#F95516]"
            strokeWidth={2.2}
          />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Rechercher un produit, une famille, un grain ou une dimension..."
          className="flex-1 bg-transparent text-lg text-[#2F3437] outline-none placeholder:text-slate-400"
        />

      </div>
    </div>
  );
}