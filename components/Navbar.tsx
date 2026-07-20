"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const router = useRouter();
  const { cart } = useCart();

  const totalArticles = cart.reduce(
    (total, article) => total + article.quantite,
    0
  );

  return (
    <header className="mb-8 flex items-center justify-between rounded-xl bg-white p-4 shadow">

      <button
        onClick={() => router.back()}
        className="rounded-lg bg-gray-200 px-4 py-2 transition hover:bg-gray-300"
      >
        ← Retour
      </button>

      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        🏠 Accueil
      </Link>

      <Link
      href="/panier"
        className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
      >
        🛒 Panier ({totalArticles})
      </Link>

    </header>
  );
}