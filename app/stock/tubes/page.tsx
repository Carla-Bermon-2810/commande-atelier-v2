"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";

const matieres = [
  {
    href: "/stock/tubes/acier",
    title: "Acier",
    image: "/tube acier.png",
  },
  {
    href: "/stock/tubes/inox",
    title: "Inox",
    image: "/tube inox.png",
  },
  {
    href: "/stock/tubes/alu",
    title: "Aluminium",
    image: "/tube alu.png",
  },
];

export default function TubesPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-8 pt-6">
        <BackButton href="/stock" />

        <div className="mb-8 mt-8">
          <h1 className="text-3xl font-bold text-[#2F3437]">
            Stock tubes
          </h1>

          <p className="mt-2 text-[#626B72]">
            Sélectionnez une matière pour consulter les tubes disponibles.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {matieres.map((matiere) => (
            <Link
              key={matiere.href}
              href={matiere.href}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-lg"
            >
              {/* Image */}
              <div className="h-56 overflow-hidden bg-slate-100">
                <img
                  src={matiere.image}
                  alt={`Tubes ${matiere.title}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Nom + flèche */}
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-2xl font-bold text-[#2F3437] transition-colors group-hover:text-[#F95516]">
                  {matiere.title}
                </h2>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white">
                  <ArrowRight size={21} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}