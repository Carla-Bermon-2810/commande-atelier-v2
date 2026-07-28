import { Bell, ShoppingCart, UserCircle2 } from "lucide-react";
import CartButton from "@/components/panier/CartButton";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-6 z-50 mb-10 rounded-3xl border border-gray-200 bg-white/90 px-8 py-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">
            D
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Commande Atelier
            </h1>

            <p className="text-sm text-gray-500">
              Découpe Laser • Catalogue interne
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-6">

        <Link
          href="/"
          className="font-medium text-gray-600 transition hover:text-blue-600"
        >
          📂 Catalogue
        </Link>

        <Link
          href="/admin/commandes"
          className="font-medium text-gray-600 transition hover:text-blue-600"
        >
          📦 Historique
        </Link>

        <Link
          href="/dashboard"
          className="font-medium text-gray-600 transition hover:text-blue-600"
        >
          🏠 Dashboard
        </Link>
        
        <Link
        href="/admin"
        className="font-medium text-gray-600 transition hover:text-blue-600"
        >
          ⚙️ Administration
        </Link>

        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">

          <button className="rounded-xl p-3 transition hover:bg-gray-100">
            <Bell className="h-5 w-5 text-gray-600" />
          </button>

          <div className="rounded-xl bg-blue-600 px-4 py-2 text-white">
            Panier
          </div>

          <button className="rounded-xl p-2 transition hover:bg-gray-100">
            <UserCircle2 className="h-9 w-9 text-gray-600" />
          </button>

        </div>

      </div>
    </header>
  );
}