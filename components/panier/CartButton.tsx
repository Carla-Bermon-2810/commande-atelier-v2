"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

export default function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/panier"
      className="relative flex items-center rounded-xl bg-[#F95516] px-4 py-2 font-semibold text-white transition hover:bg-[#dd4b13]"
    >
      <ShoppingCart className="mr-2 h-4 w-4" />
      Panier

      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-[#F95516]">
          {totalItems}
        </span>
      )}
    </Link>
  );
}