"use client";

import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";

interface Props {
  article: {
    id?: number;
    article?: string;
    produit?: string;
    categorie?: string;
    famille: string;
    grain?: string;
    dimension?: string;
    photo?: string | null;
  };
}

export default function ArticleCard({ article }: Props) {
  const { addToCart } = useCart();
  const router = useRouter();

  const nom = article.produit || article.article || "Article";

  function ajouterAuPanier() {
    addToCart({
      article: nom,
      famille: article.famille,
      photo: article.photo || undefined,
      quantite: 1,
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-xl">

      {/* Photo */}
      <div className="flex h-56 items-center justify-center bg-slate-100">
        {article.photo ? (
          <img
            src={article.photo}
            alt={nom}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      {/* Informations */}
      <div className="p-5">

        <h2 className="text-lg font-bold text-[#2F3437]">
          {nom}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {article.famille}
        </p>

        {(article.grain || article.dimension) && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
            {article.grain && (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Grain : {article.grain}
              </span>
            )}

            {article.dimension && (
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {article.dimension}
              </span>
            )}
          </div>
        )}

        {/* Boutons */}
        <div className="mt-5 flex gap-2">

          <button
            onClick={() =>
              router.push(
                `/produit/${encodeURIComponent(nom)}`
              )
            }
            className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Voir
          </button>

          <button
            onClick={ajouterAuPanier}
            className="flex-1 rounded-xl bg-[#F95516] py-3 font-semibold text-white transition hover:opacity-90"
          >
            🛒 Ajouter
          </button>

        </div>

      </div>
    </div>
  );
}