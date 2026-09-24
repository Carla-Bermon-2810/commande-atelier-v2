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
      <main className="w-full px-6 py-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Espace de travail</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><Boxes size={27} /></div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2F3437] sm:text-4xl">Stock atelier</h1>
                  <p className="mt-1 text-slate-500">Ouvrez une famille pour consulter, ajuster ou compléter son stock.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2"><Package size={17} className="text-[#F95516]" />4 familles de suivi</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><ScanSearch size={17} className="text-[#F95516]" />Recherche dans chaque famille</span>
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600 sm:px-8">Conseil opérateur : choisissez d’abord la famille, puis filtrez par matière, dimension ou référence.</div>
        </section>

        {/* Cartes */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"
            >
              {/* Photo */}
              <div className="relative h-72 overflow-hidden bg-slate-100">
                <Image
                  src={category.image}
                  alt={category.title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#F95516]">Gestion stock</p>
                <div>
                  <h2 className="mt-2 text-2xl font-bold text-[#2F3437]">
                    {category.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {category.description}
                  </p>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-medium text-slate-600">{category.detail}</p>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#F95516]">
                  Ouvrir le suivi
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-[#F95516] group-hover:text-white"><ArrowUpRight size={20} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
