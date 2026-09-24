"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Disc3,
  Flame,
  Package,
  Scissors,
  ShieldCheck,
  Wrench,
} from "lucide-react";

const categoryImages: Record<string, string> = {
  abrasif: "/category-abrasif-v1.png",
  "outils de coupe": "/category-outils-coupe-v1.png",
  "poste soudure": "/category-soudure-v1.png",
  consommable: "/category-consommable-v1.png",
  quincaillerie: "/category-quincaillerie-v1.png",
  epi: "/category-epi-v1.png",
};

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
  const image = categoryImages[icon.toLowerCase()] ?? "/hero-atelier-v3.png";

  return (
    <div className="h-full">
      <Link href={href} className="block h-full">
        <div className="group relative flex h-full min-h-52 flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 bg-[#132128] shadow-[0_5px_15px_rgba(15,23,42,0.1)] transition-all duration-200 hover:-translate-y-1 hover:border-[#f15a24] hover:shadow-[0_18px_34px_rgba(15,23,42,0.18)] sm:min-h-60 lg:min-h-[13.9rem] lg:rounded-xl">
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover opacity-85 transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,20,25,.02)_25%,rgba(10,18,23,.92)_100%)]" />
          <div className="relative z-10 flex items-end justify-between gap-3 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f15a24]/20 text-[#ff8c65] backdrop-blur-sm"><Icon size={21} strokeWidth={2} /></div>
              <h3 className="text-lg font-bold uppercase tracking-[.05em] text-white sm:text-xl">{title}</h3>
              <p className="mt-1 text-sm text-slate-300">{count} article{count > 1 ? "s" : ""}</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f15a24] text-white shadow-lg transition group-hover:translate-x-1 group-hover:bg-[#d84b1a]"><ArrowRight size={21} /></span>
          </div>
        </div>
      </Link>
    </div>
  );
}
