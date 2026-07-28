"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";

export default function CartButton() {
  const { totalItems } = useCart();

  return (
    <button
      className="relative rounded-lg bg-blue-600 px-4 py-2 text-white"
      onClick={() => alert("Le panneau panier arrive juste après 😉")}
    >
      <ShoppingCart className="mr-2 inline h-4 w-4" />
      Panier

      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {totalItems}
        </span>
      )}
    </button>
  );
}