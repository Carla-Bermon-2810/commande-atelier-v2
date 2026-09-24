"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

export default function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/panier"
      className="relative flex min-h-11 items-center rounded-xl bg-[#111b20] px-3 py-2 font-semibold text-white transition hover:bg-[#1e4c5e] sm:px-4"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Panier</span>

      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f15a24] px-1 text-xs font-bold text-white">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
