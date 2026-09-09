import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const categories = [
  {
    href: "/stock/tubes",
    title: "Tubes",
    description: "Tubes acier, inox et aluminium",
    image: "tube.jpg",
  },
  {
    href: "/stock/tiges-filetees",
    title: "Tiges filetées",
    description: "Tiges filetées et barres filetées",
    image: "tige filete.webp",
  },
  {
    href: "/stock/inserts",
    title: "Inserts",
    description: "Inserts et éléments de fixation",
    image: "insert.webp",
  },
  {
    href: "/stock/vis",
    title: "Vis",
    description: "Visserie de l'atelier",
    image: "vis.jpg",
  },
  {
    href: "/stock/ecrous",
    title: "Écrous",
    description: "Écrous et éléments associés",
    image: "ecrou.webp",
  },
];

export default function StockPage() {
  return (
    <AppLayout>
      <main className="w-full px-6 py-6 lg:px-8">
        {/* Titre */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <Package size={42} className="text-[#F95516]" />

            <h1 className="text-4xl font-bold text-[#2F3437]">
              STOCK
            </h1>
          </div>

          <p className="mt-2 text-lg text-slate-500">
            Sélectionnez la famille de produits que vous souhaitez gérer.
          </p>
        </div>

        {/* Cartes */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
            >
              {/* Photo */}
              <div className="relative h-64 overflow-hidden bg-slate-100">
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Titre */}
              <div className="flex items-center justify-between px-6 py-6">
                <h2 className="text-2xl font-bold text-[#2F3437]">
                  {category.title}
                </h2>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white">
                  <ArrowRight size={22} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}