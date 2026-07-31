"use client";

import { Package, Tag, Folder } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  article: any;
};

export default function AdminArticleCard({ article }: Props) {
  const photo =
    article.photo &&
    supabase.storage.from("photos").getPublicUrl(article.photo).data.publicUrl;
    const router = useRouter();

    return (
        <div
          onClick={() => router.push(`/admin/articles/${article.id}`)}
          className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl"
        >

        {/* Photo */}
        <div className="flex h-44 items-center justify-center bg-slate-100">
          {photo ? (
            <img
              src={photo ? `${photo}?t=${Date.now()}` : ""}
              alt={article.produit}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <Package className="h-14 w-14 text-slate-300" />
          )}
        </div>
    
        {/* Contenu */}
        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 font-semibold text-slate-800">
            {article.produit}
          </h3>
    
          <div className="flex flex-wrap gap-2">
            {article.categorie && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                <Folder size={14} />
                {article.categorie}
              </span>
            )}
    
            {article.famille && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <Tag size={14} />
                {article.famille}
              </span>
            )}
          </div>
    
          {(article.grain || article.dimension) && (
            <div className="flex gap-4 text-sm text-slate-500">
              {article.grain && (
                <span>
                  <strong>Grain :</strong> {article.grain}
                </span>
              )}
    
              {article.dimension && (
                <span>
                  <strong>Dim :</strong> {article.dimension}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }