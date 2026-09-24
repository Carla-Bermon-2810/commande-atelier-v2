"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/context/cart-context";
import {
  ArrowLeft,
  History,
  Home,
  ShoppingCart,
} from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { cart } = useCart();

  const totalArticles = cart.reduce(
    (total, article) => total + article.quantite,
    0
  );

  return (
    <header className="sticky top-4 z-50 mb-8">

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-6 py-4 shadow-lg backdrop-blur">

        {/* Logo */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F95516] text-xl font-bold text-white shadow">
            DL
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F95516]">
              Découpe Laser
            </p>

            <h1 className="text-lg font-bold text-[#2F3437]">
              Commande Atelier
            </h1>
          </div>
        </Link>

        {/* Actions */}

        <div className="flex items-center gap-3">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-medium text-[#626B72] transition hover:border-[#F95516] hover:text-[#F95516]"
          >
            <ArrowLeft size={18} />
            Retour
          </button>

          <Link
            href="/"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition ${
              pathname === "/"
                ? "bg-[#F95516] text-white"
                : "border border-slate-200 text-[#626B72] hover:border-[#F95516] hover:text-[#F95516]"
            }`}
          >
            <Home size={18} />
            Accueil
          </Link>

          {pathname === "/panier" && (
            <Link
              href="/admin/commandes"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 font-medium text-[#626B72] transition hover:border-[#F95516] hover:text-[#F95516]"
            >
              <History size={18} />
              Historique
            </Link>
          )}

          <Link
            href="/panier"
            className="relative flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-2 font-semibold text-white transition hover:bg-[#dd4b13]"
          >
            <ShoppingCart size={18} />

            Panier

            {totalArticles > 0 && (
              <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-2 text-xs font-bold text-[#F95516]">
                {totalArticles}
              </span>
            )}
          </Link>

        </div>

      </div>

    </header>
  );
}