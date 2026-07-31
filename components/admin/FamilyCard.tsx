"use client";

import { supabase } from "@/lib/supabase";

type Props = {
  famille: any;
  nbArticles: number;
  selectionnee: boolean;
  onClick: () => void;
};

export default function FamilyCard({
  famille,
  nbArticles,
  selectionnee,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`overflow-hidden rounded-xl border transition-all duration-200 ${
        selectionnee
          ? "border-[#F95516] bg-[#F95516] text-white shadow-lg"
          : "bg-white hover:-translate-y-1 hover:border-[#F95516] hover:shadow-md"
      }`}
    >
      {famille.photo ? (
        <img
          src={
            supabase.storage
              .from("photos")
              .getPublicUrl(famille.photo).data.publicUrl
          }
          alt={famille.famille}
          className="h-24 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 items-center justify-center bg-gray-100 text-4xl">
          📁
        </div>
      )}

      <div className="p-3 text-left">
        <div className="font-semibold">
          {famille.famille}
        </div>

        <div
          className={`mt-1 text-sm ${
            selectionnee
              ? "text-orange-100"
              : "text-gray-500"
          }`}
        >
          {nbArticles} article(s)
        </div>
      </div>
    </button>
  );
}