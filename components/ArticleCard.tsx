"use client";

import { useCart } from "@/context/CartContext";

interface Props {
  article: {
    article: string;
    famille: string;
    photo?: string | null;
  };
}

export default function ArticleCard({ article }: Props) {
  const { addToCart } = useCart();

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-md transition hover:scale-105 hover:shadow-xl">
      <div className="flex h-56 items-center justify-center bg-gray-100">
        {article.photo ? (
          <img
            src={article.photo}
            alt={article.article}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      <div className="p-5">
        <h2 className="text-lg font-bold">
          {article.article}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Famille : {article.famille}
        </p>

        <button
          onClick={() =>
            addToCart({
              article: article.article,
              famille: article.famille,
              photo: article.photo ?? undefined,
              quantite: 1,
            })
          }
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}