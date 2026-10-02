"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import type { StockCatalogueType } from "@/lib/stock-articles-catalogue";

const data = {
  abrasifs: {
    title: "Abrasifs", description: "Préparez les références réellement suivies avant de renseigner le stock physique.", image: "/category-abrasif-v1.png",
    cards: [
      ["Bandes abrasives", "/family-bandes-abrasives-v1.png"], ["Brosses métalliques", "/family-brosses-metalliques-v1.png"], ["Disques", "/family-disques-v1.png"], ["Plateau ponceuse", "/family-plateaux-ponceuse-v1.png"], ["Roues", "/family-roues-v1.png"], ["Satinage", "/family-satinage-v1.png"],
    ],
  },
  soudure: {
    title: "Soudure", description: "Consommables et équipements MIG, TIG et Laser à initialiser depuis les relevés atelier.", image: "/category-soudure-v1.png",
    cards: [["MIG", "/category-soudure-v1.png"], ["TIG", "/category-soudure-v1.png"], ["LASER", "/category-soudure-v1.png"]],
  },
  epi: {
    title: "EPI", description: "Équipements de protection à initialiser uniquement après relevé réel dans l’atelier.", image: "/category-epi-v1.png",
    cards: [["Gants", "/category-epi-v1.png"], ["Protection visage", "/category-epi-v1.png"], ["Casques de soudage", "/category-epi-v1.png"], ["Protection respiratoire", "/category-epi-v1.png"], ["Chaussures de sécurité", "/category-epi-v1.png"], ["Lunettes de sécurité", "/category-epi-v1.png"], ["Bouchon d'oreilles", "/category-epi-v1.png"]],
  },
  consommables: {
    title: "Consommables", description: "Produits d’atelier, nettoyage et accessoires à initialiser à partir des relevés réels.", image: "/category-consommable-v1.png",
    cards: [["Lames", "/category-consommable-v1.png"], ["Limes", "/category-consommable-v1.png"], ["Nettoyage", "/category-consommable-v1.png"], ["Outils", "/category-consommable-v1.png"], ["Pinces", "/category-consommable-v1.png"], ["Produits chimiques", "/category-consommable-v1.png"], ["Protection", "/category-consommable-v1.png"]],
  },
} as const;

function slug(value: string) { return value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export default function StockCatalogueOverview({ type }: { type: StockCatalogueType }) {
  const page = data[type];
  return <AppLayout><main className="mx-auto max-w-[1500px] py-2 sm:py-4 lg:py-7"><Link href="/stock" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:border-orange-200 hover:text-[#F95516]">← Retour au Stock</Link><section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative overflow-hidden px-5 py-7 sm:px-7"><Image src={page.image} alt="" fill className="object-cover opacity-10" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#F95516]">Stock · Nouveau suivi</p><h1 className="mt-1 text-3xl font-black text-[#17232b] sm:text-4xl">{page.title}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">{page.description}</p></div></div></section><div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#F95516]">Explorer les références</p><h2 className="mt-1 text-2xl font-black text-[#17232b]">Choisir une famille</h2></div><Link href={`/stock/${type}/toutes`} className="text-sm font-bold text-[#F95516] hover:underline">Voir toutes les références</Link></div><section className={`mt-4 grid gap-4 ${page.cards.length > 4 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-3"}`}>{page.cards.map(([name, image]) => <Link key={name} href={`/stock/${type}/${slug(name)}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl"><div className="relative h-36 overflow-hidden bg-slate-100"><Image src={image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" /></div><div className="flex items-center justify-between p-4"><div><p className="text-xs font-bold uppercase tracking-[.13em] text-[#F95516]">Suivi atelier</p><h3 className="mt-1 text-lg font-black text-[#17232b]">{name}</h3></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white"><ArrowRight size={19} /></span></div></Link>)}</section><Link href={`/stock/${type}/toutes`} className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#17232b] shadow-sm hover:border-orange-200 hover:bg-orange-50"><Package className="text-[#F95516]" size={20} />Initialiser ou consulter les références importées</Link></main></AppLayout>;
}
