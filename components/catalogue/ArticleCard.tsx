"use client";

import { useCart } from "@/context/cart-context";
import { useRouter } from "next/navigation";

interface Props {
  article: {
    article: string;
    produit?: string;
    famille: string;
    photo?: string | null;
  };
}

export default function ArticleCard({ article }: Props) {
  const { addToCart } = useCart();
  const router = useRouter();

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
            router.push(
              `/produit/${encodeURIComponent(
                article.produit || article.article
              )}`
            )
          }
          className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Voir le produit
        </button>
      </div>
    </div>
  );
}