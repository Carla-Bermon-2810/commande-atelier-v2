"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertTriangle, ArrowRight, BellRing, Box, CircleAlert, CircleCheck, Cylinder, Disc3, Drill, FlaskConical, HardHat, Hexagon, Package, Ruler, Search, ShoppingCart, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import StockAlertBadge from "@/components/stock/StockAlertBadge";
import { useStockAlerts } from "@/lib/stock-alerts-client";

const categories = [
  { href: "/stock/tubes", key: "Tubes", title: "Tubes", generic: undefined, icon: Cylinder, image: "/tube.jpg" },
  { href: "/stock/tiges-filetees", key: "Tiges filetées", title: "Tiges filetées", generic: undefined, icon: Ruler, image: "/tige filete.webp" },
  { href: "/stock/fixations", key: "Fixations", title: "Fixations", generic: undefined, icon: Wrench, image: "/fixation.png" },
  { href: "/stock/outillage", key: "Outillage", title: "Outillage", generic: undefined, icon: Drill, image: "/outillage.png" },
  { href: "/stock/abrasifs", key: "Abrasifs", title: "Abrasifs", generic: "abrasifs", icon: Disc3, image: "/category-abrasif-v1.png" },
  { href: "/stock/soudure", key: "Soudure", title: "Soudure", generic: "soudure", icon: FlaskConical, image: "/category-soudure-v1.png" },
  { href: "/stock/epi", key: "EPI", title: "EPI", generic: "epi", icon: HardHat, image: "/category-epi-v1.png" },
  { href: "/stock/consommables", key: "Consommables", title: "Consommables", generic: "consommables", icon: Box, image: "/category-consommable-v1.png" },
] as const;

function StatCard({ href, label, value, tone, icon: Icon }: { href: string; label: string; value: number; tone: "ok" | "warning" | "danger" | "neutral"; icon: typeof CircleCheck }) {
  const tones = { ok: "bg-emerald-50/80 text-emerald-600", warning: "bg-orange-50 text-[#f97316]", danger: "bg-red-50 text-red-600", neutral: "bg-slate-100 text-slate-500" };
  return <Link href={href} className={`group rounded-xl px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone]}`}><div className="flex items-center gap-2.5"><Icon size={23} strokeWidth={2.5} /><p className="text-sm font-bold">{label}</p></div><p className="mt-1.5 pl-9 text-2xl font-black tracking-tight text-[#111820]">{value.toLocaleString("fr-FR")} <span className="text-xs font-medium text-slate-500">références</span></p></Link>;
}

export default function StockPage() {
  const router = useRouter();
  const { data, isLoading } = useStockAlerts();
  const [search, setSearch] = useState("");
  const metrics = data?.indicateurs;
  const rupture = metrics?.ruptures ?? 0;
  const aRecommander = Math.max(0, (metrics?.alertes ?? 0) - rupture);
  const stockOk = Math.max(0, (metrics?.referencesSuivies ?? 0) - (metrics?.alertes ?? 0) - (metrics?.seuilsNonDefinis ?? 0));
  const aInitialiser = metrics?.referencesAInitialiser ?? 0;
  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const query = search.trim(); router.push(query ? `/stock/alertes?recherche=${encodeURIComponent(query)}` : "/stock/alertes"); }

  return <AppLayout><main className="mx-auto max-w-[1500px] py-1 sm:py-3 lg:py-5">
    <section className="relative isolate min-h-[15.5rem] overflow-hidden rounded-2xl bg-[#101b21] px-6 py-7 text-white shadow-[0_16px_38px_rgba(15,23,42,.16)] sm:px-9 sm:py-8" style={{ backgroundImage: "linear-gradient(90deg, rgba(7,16,21,.98) 0%, rgba(7,16,21,.92) 35%, rgba(7,16,21,.25) 72%, rgba(7,16,21,.10) 100%), url('/stock-atelier-hero-v1.png')", backgroundPosition: "center", backgroundSize: "cover" }}>
      <div className="relative max-w-2xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#ff7a42]">Gestion du stock atelier</p><h1 className="!mt-2 !text-4xl !font-black !tracking-tight !text-white sm:!text-5xl">Stock Atelier</h1><p className="mt-2 max-w-xl text-base font-medium leading-relaxed text-slate-100 sm:text-lg">Retrouvez rapidement une référence, consultez les quantités disponibles et ajoutez vos articles directement au panier.</p></div>
      <div className="relative mt-6 flex flex-wrap gap-x-7 gap-y-4 text-sm font-bold sm:gap-x-10"><span className="flex items-center gap-3"><Package className="text-[#ff641f]" size={29} /><span>Stock en temps réel<small className="mt-0.5 block text-xs font-medium text-slate-300">Quantités actualisées</small></span></span><span className="flex items-center gap-3 border-l border-white/20 pl-7"><BellRing className="text-[#ff641f]" size={29} /><span>Alertes automatiques<small className="mt-0.5 block text-xs font-medium text-slate-300">Seuils et ruptures</small></span></span><span className="flex items-center gap-3 border-l border-white/20 pl-7"><ShoppingCart className="text-[#ff641f]" size={29} /><span>Commande rapide<small className="mt-0.5 block text-xs font-medium text-slate-300">Ajout direct au panier</small></span></span></div>
    </section>
    <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-[#F95516]"><Hexagon size={21} /></span><div><h2 className="font-black text-[#17232b]">État du stock</h2><p className="text-xs text-slate-500">Vue globale de toutes les familles.</p></div></div><div className="flex items-center gap-3"><Link href="/stock/alertes" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-orange-300 px-3 text-xs font-bold text-[#e64b12] transition hover:bg-orange-50"><BellRing size={16} />Centre d’alertes <StockAlertBadge group={data?.global} /></Link><Link href="/stock/alertes" className="hidden items-center gap-2 text-xs font-bold text-[#F95516] hover:underline sm:flex">Voir les alertes <ArrowRight size={16} /></Link></div></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><StatCard href="/stock/alertes?statut=ok" label="Stock OK" value={stockOk} tone="ok" icon={CircleCheck} /><StatCard href="/stock/alertes?statut=a-recommander" label="À recommander" value={aRecommander} tone="warning" icon={CircleAlert} /><StatCard href="/stock/alertes?statut=rupture" label="Ruptures" value={rupture} tone="danger" icon={AlertTriangle} /><StatCard href="/stock/alertes?statut=non-defini" label="À initialiser" value={aInitialiser} tone="neutral" icon={Box} /></div>
    </section>
    <form onSubmit={submitSearch} className="mt-4 flex gap-3"><label className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#17232b]" size={22} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une référence, un produit, une matière, une dimension..." className="min-h-14 w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-medium shadow-sm outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100" /></label><button type="submit" className="min-h-14 rounded-xl bg-[#F95516] px-6 text-sm font-black text-white shadow-[0_9px_18px_rgba(249,85,22,.22)] transition hover:bg-[#e64b12]">Rechercher</button></form>
    <section aria-label="Familles de stock" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{categories.map((category) => { const group = data?.parCategorie[category.key]; const count = category.generic ? data?.referencesCatalogueParType?.[category.generic] ?? 0 : group?.nombreReferences ?? 0; const Icon = category.icon; return <Link key={category.href} href={category.href} className="group relative flex h-[10rem] items-end overflow-hidden rounded-xl bg-[#101b21] p-4 text-white shadow-[0_8px_20px_rgba(15,23,42,.13)] transition hover:-translate-y-1 hover:shadow-xl"><Image src={category.image} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,21,.05),rgba(7,16,21,.88))]" /><div className="relative z-10 flex w-full items-end justify-between gap-3"><span className="flex min-w-0 items-end gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950/65 text-white backdrop-blur"><Icon size={24} /></span><span><span className="block text-lg font-black leading-tight">{category.title}</span><small className="mt-1 block text-sm font-medium text-slate-200">{isLoading ? "Chargement…" : `${count} article${count > 1 ? "s" : ""}`}</small></span></span><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F95516] transition group-hover:translate-x-1"><ArrowRight size={20} /></span></div></Link>; })}</section>
  </main></AppLayout>;
}
