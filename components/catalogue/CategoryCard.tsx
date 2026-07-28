"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link href={href} className="block h-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-2xl">

          {/* Barre orange */}
          <div className="absolute left-0 top-0 h-full w-0.5 bg-[#F95516] opacity-0 transition-all duration-300 group-hover:opacity-100" />

          <div className="flex items-center justify-between">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-[#626B72] transition-all duration-300 group-hover:bg-[#F95516] group-hover:text-white">
              <Icon size={30} strokeWidth={2} />
            </div>

            <ArrowRight
              size={22}
              className="text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#F95516]"
            />

          </div>

          <div className="mt-8 flex-1">

            <h3 className="text-2xl font-bold uppercase tracking-wide text-[#2F3437]">
              {title}
            </h3>

            <div className="mt-4 h-px w-12 bg-slate-200 transition-all duration-300 group-hover:w-24 group-hover:bg-[#F95516]" />

            <p className="mt-4 text-sm text-[#626B72]">
              {count} article{count > 1 ? "s" : ""}
            </p>

          </div>

        </div>
      </Link>
    </motion.div>
  );
}