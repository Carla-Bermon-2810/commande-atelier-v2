import { ShoppingCart } from "lucide-react";

export default function CartButton() {
  return (
    <button className="relative flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition">
      <ShoppingCart size={20} />
      <span>Panier</span>

      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
        0
      </span>
    </button>
  );
}