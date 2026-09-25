import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const categories = [
  {
    href: "/stock/tubes",
    title: "Tubes",
    description: "Tubes acier, inox et aluminium",
    badge: "Acier · Inox · Aluminium",
    image: "/tube.jpg",
  },
  {
    href: "/stock/tiges-filetees",
    title: "Tiges filetées",
    description: "Tiges filetées et barres filetées",
    badge: "Tiges filetées · Barres",
    image: "/tige filete.webp",
  },
  {
    href: "/stock/fixations",
    title: "Fixations",
    description: "Références conditionnées et seuils minimum",
    badge: "Vis · Écrous · Inserts · Rivets",
    image: "/fixation.png",
  },
  {
    href: "/stock/outillage",
    title: "Outillage",
    description: "Sélection par diamètre et type d’outil",
    badge: "Forets · Fraises · Tarauds",
    image: "/outillage.png",
  },
];

export default function StockPage() {
  return (
    <AppLayout>
      <div className="w-full px-1 py-5 sm:px-3 sm:py-7 lg:px-5 lg:py-8">
        <section className="mb-5 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-5">
          <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#F95516]">Espace de travail</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff1e9] text-[#F95516]">
              <Package size={25} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#17232b] sm:text-3xl">Stock atelier</h1>
              <p className="mt-1 text-sm text-slate-500 sm:text-base">Consultez les quantités disponibles par famille.</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group relative flex min-h-[23rem] flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-[#172025] p-5 text-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F95516] sm:min-h-[25rem] sm:p-6"
            >
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,23,.18)_0%,rgba(10,18,23,.08)_30%,rgba(10,18,23,.74)_65%,rgba(10,18,23,.98)_100%)]" />

              <span className="relative z-10 w-fit max-w-full rounded-full bg-[#293741]/90 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                {category.badge}
              </span>

              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-wide text-[#ff8053]">Gestion stock</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{category.title}</h2>
                <p className="mt-1 min-h-12 max-w-[17rem] text-sm leading-snug text-slate-200 sm:text-base">
                  {category.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="inline-flex min-h-10 min-w-[11rem] items-center rounded-full bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm">
                    Ouvrir le suivi
                  </span>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F95516] text-white transition-transform group-hover:translate-x-1">
                    <ArrowRight size={21} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
