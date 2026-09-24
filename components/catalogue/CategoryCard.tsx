"use client";

import Link from "next/link";
import Image from "next/image";
import { categoryImage } from "@/lib/category-visuals";
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
  const image = categoryImage(icon);

  return (
    <div className="h-full">
      <Link href={href} className="block h-full">
        <div className="group relative flex h-full min-h-44 flex-col justify-end overflow-hidden rounded-xl border border-slate-200 bg-[#132128] shadow-[0_5px_15px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-[0_18px_34px_rgba(15,23,42,0.18)] sm:min-h-48 lg:min-h-[12rem]">
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover opacity-85 transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,20,25,.02)_25%,rgba(10,18,23,.92)_100%)]" />
          <div className="relative z-10 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F95516]/20 text-[#ff8c65] backdrop-blur-sm"><Icon size={19} strokeWidth={2} /></div>
              <h3 className="text-base font-bold uppercase tracking-[.05em] text-white sm:text-lg">{title}</h3>
              <p className="mt-1 text-sm text-slate-300">{count} article{count > 1 ? "s" : ""}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F95516] text-white shadow-lg transition group-hover:translate-x-1 group-hover:bg-[#d84b1a]"><ArrowRight size={20} /></span>
          </div>
        </div>
      </Link>
    </div>
  );
}
