import Link from "next/link";
import { ArrowRight, Drill, Settings, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const categories = [
  {
    href: "/stock/outillage/forets",
    title: "Forets",
    icon: Drill,
  },
  {
    href: "/stock/outillage/fraises",
    title: "Fraises",
    icon: Settings,
  },
  {
    href: "/stock/outillage/tarauds",
    title: "Tarauds",
    icon: Wrench,
  },
];

export default function OutillagePage() {
  return (
    <AppLayout>
      <main className="w-full px-6 py-6 lg:px-8">

        <div className="mb-10">
          <h1 className="text-4xl font-bold text-[#2F3437]">
            OUTILLAGE
          </h1>

          <p className="mt-2 text-lg text-slate-500">
            Sélectionnez la famille d&apos;outillage que vous souhaitez gérer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">

          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.href}
                href={category.href}
                className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]">
                  <Icon size={34} />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-[#2F3437]">
                    {category.title}
                  </h2>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white">
                    <ArrowRight size={22} />
                  </div>
                </div>
              </Link>
            );
          })}

        </div>

      </main>
    </AppLayout>
  );
}