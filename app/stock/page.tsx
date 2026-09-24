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
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-[linear-gradient(120deg,#11252d,#1e4c5e)] text-white shadow-[0_16px_36px_rgba(15,23,42,.14)]">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6a17b]">Espace de travail</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#f1b08b]"><Boxes size={27} /></div>
                <div>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">Stock atelier</h1>
                  <p className="mt-1 text-slate-200">Ouvrez une famille pour consulter, ajuster ou compléter son stock.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-100">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><Package size={17} className="text-[#e6a17b]" />4 familles de suivi</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2"><ScanSearch size={17} className="text-[#e6a17b]" />Recherche dans chaque famille</span>
            </div>
          </div>
          <div className="border-t border-white/10 bg-black/10 px-6 py-3 text-sm text-slate-200 sm:px-8">Conseil opérateur : choisissez d’abord la famille, puis filtrez par matière, dimension ou référence.</div>
        </section>

        {/* Cartes */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group relative min-h-[21rem] overflow-hidden rounded-3xl border border-slate-200 bg-[#132128] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#356779] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#1e4c5e] focus:ring-offset-2"
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

              <div className="relative flex min-h-[21rem] flex-col justify-end p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#e6a17b]">Gestion stock</p>
                <div>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {category.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-200">
                    {category.description}
                  </p>
                  <p className="mt-3 border-t border-white/15 pt-3 text-sm font-medium text-slate-200">{category.detail}</p>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#f1b08b]">
                  Ouvrir le suivi
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d98257] text-white transition group-hover:translate-x-1 group-hover:bg-[#bd6b44]"><ArrowUpRight size={20} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
