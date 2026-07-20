"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartButton() {
  const { cart } = useCart();

  const totalArticles = cart.reduce(
    (total, article) => total + article.quantite,
    0
  );

  return (
    <Link
      href="/panier"
      className="relative flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
    >
      <ShoppingCart size={20} />
      <span>Panier</span>

      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
        {totalArticles}
      </span>
    </Link>
  );
}