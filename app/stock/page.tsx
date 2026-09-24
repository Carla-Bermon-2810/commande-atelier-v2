import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Boxes, Package, ScanSearch } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const categories = [
  {
    href: "/stock/tubes",
    title: "Tubes",
    description: "Tubes acier, inox et aluminium",
    detail: "Suivi par matière, section et longueur",
    image: "/tube.jpg",
  },
  {
    href: "/stock/tiges-filetees",
    title: "Tiges filetées",
    description: "Tiges filetées et barres filetées",
    detail: "Suivi par matière et diamètre",
    image: "/tige filete.webp",
  },
  {
    href: "/stock/fixations",
    title: "Fixations",
    description: "Vis, écrous, inserts et rivets",
    detail: "Références conditionnées et seuils minimum",
    image: "/fixation.png",
  },
  {
    href: "/stock/outillage",
    title: "Outillage",
    description: "Forets, fraises et tarauds",
    detail: "Sélection par diamètre et type d’outil",
    image: "/outillage.png",
  },
];

export default function StockPage() {
  return (
    <AppLayout>
      <main className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <section className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Espace de travail</p>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-[#F95516]"><Boxes size={25} /></div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Stock atelier</h1>
                  <p className="mt-1 text-sm text-slate-500">Consultez les quantités disponibles par famille.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><Package size={16} className="text-[#F95516]" />4 familles de suivi</span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"><ScanSearch size={16} className="text-[#F95516]" />Recherche par famille</span>
            </div>
          </div>
        </section>

        {/* Cartes */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group relative min-h-[16rem] overflow-hidden rounded-xl border border-slate-200 bg-[#132128] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"
            >
              <div className="absolute inset-0 overflow-hidden bg-slate-100">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,25,31,.04)_30%,rgba(10,18,23,.96)_100%)]" />

              <div className="relative flex min-h-[16rem] flex-col justify-end p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff8d5c]">Gestion stock</p>
                <div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {category.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-200">
                    {category.description}
                  </p>
                  <p className="mt-3 border-t border-white/15 pt-3 text-sm font-medium text-slate-200">{category.detail}</p>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#ff8d5c]">
                  Ouvrir le suivi
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F95516] text-white transition group-hover:translate-x-1 group-hover:bg-[#d84b1a]"><ArrowUpRight size={20} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
