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
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
      <Link href={href}>
        <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-500 hover:shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
              <Icon size={28} />
            </div>

            <ArrowRight
              size={20}
              className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-blue-600"
            />
          </div>

          <h3 className="mt-6 text-xl font-semibold text-slate-800">
            {title}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {count} article{count > 1 ? "s" : ""}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}