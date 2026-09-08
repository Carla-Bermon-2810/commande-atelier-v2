import { Package } from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl p-8">

        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <Link
            href="/stock"
            className="group rounded-2xl border bg-white p-6 shadow transition hover:border-[#F95516] hover:shadow-md"
          >
            <Package
              size={48}
              className="text-[#F95516] transition group-hover:scale-105"
            />

            <h2 className="mt-4 text-xl font-bold">
              Stock
            </h2>

            <p className="mt-2 text-gray-500">
              Gestion des tubes de l'atelier.
            </p>
          </Link>

          <div className="rounded-2xl border bg-white p-6 shadow opacity-60">

            <div className="text-5xl">📊</div>

            <h2 className="mt-4 text-xl font-bold">
              Statistiques
            </h2>

            <p className="mt-2 text-gray-500">
              Bientôt disponible.
            </p>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}