import Link from "next/link";
import { ArrowRight } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";

const categories = [
  {
    href: "/stock/fixations/vis",
    title: "Vis",
    image: "/vis.jpg",
  },
  {
    href: "/stock/fixations/ecrous",
    title: "Écrous",
    image: "/ecrou.webp",
  },
  {
    href: "/stock/fixations/inserts",
    title: "Inserts",
    image: "/insert.webp",
  },
];

export default function FixationsPage() {
  return (
    <AppLayout>
      <main className="w-full px-6 py-6 lg:px-8">
        <BackButton href="/stock" />

        <div className="mx-auto max-w-7xl py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2F3437]">
              Fixations
            </h1>

            <p className="mt-2 text-[#626B72]">
              Sélectionnez une famille de fixation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-lg"
              >
                <div className="h-56 overflow-hidden bg-slate-100">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex items-center justify-between px-6 py-5">
                  <h2 className="text-2xl font-bold text-[#2F3437] transition-colors group-hover:text-[#F95516]">
                    {category.title}
                  </h2>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white">
                    <ArrowRight size={21} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}