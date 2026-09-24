"use client";

import Link from "next/link";
import {
  ArrowRight,
  Disc3,
  Flame,
  Package,
  Scissors,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const icons = {
  abrasif: Disc3,
  "outils de coupe": Scissors,
  "poste soudure": Flame,
  consommable: Package,
  quincaillerie: Wrench,
  epi: ShieldCheck,
};

type Props = {
  title: string;
  href: string;
  icon: string;
  count?: number;
};

export default function CategoryCard({
  title,
  href,
  icon,
  count = 0,
}: Props) {
  const Icon =
    icons[icon.toLowerCase() as keyof typeof icons] ?? Package;

  return (
    <div className="h-full">
      <Link href={href} className="block h-full">
        <div className="group relative flex h-full min-h-48 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(30,41,59,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_14px_28px_rgba(30,41,59,0.10)]">

          {/* Barre orange */}
          <div className="absolute left-0 top-0 h-full w-0.5 bg-[#F95516] opacity-0 transition-all duration-300 group-hover:opacity-100" />

          <div className="flex items-center justify-between">

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition-colors duration-200 group-hover:bg-[#F95516] group-hover:text-white">
              <Icon size={26} strokeWidth={2} />
            </div>

            <ArrowRight
              size={22}
              className="text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#F95516]"
            />

          </div>

          <div className="mt-5 flex-1">

            <h3 className="text-lg font-bold uppercase tracking-[.06em] text-[#2F3437]">
              {title}
            </h3>

            <div className="mt-3 h-px w-12 bg-slate-200 transition-all duration-300 group-hover:w-24 group-hover:bg-[#F95516]" />

            <p className="mt-3 text-sm text-[#626B72]">
              {count} article{count > 1 ? "s" : ""}
            </p>

          </div>

        </div>
      </Link>
    </div>
  );
}
