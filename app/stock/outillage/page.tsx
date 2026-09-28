"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleAlert, Drill, Package, TriangleAlert, Wrench } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockAlertBadge from "@/components/stock/StockAlertBadge";
import { useStockAlerts } from "@/lib/stock-alerts-client";

const familles = [
  { href: "/stock/outillage/forets", title: "Forets", image: "/forets.png", detail: "Diamètres et matières de perçage" },
  { href: "/stock/outillage/fraises", title: "Fraises", image: "/fraises.png", detail: "Formes et diamètres de fraisage" },
  { href: "/stock/outillage/tarauds", title: "Tarauds", image: "/tarauds.png", detail: "Filetages et dimensions disponibles" },
];

function KpiCard({ label, value, detail, tone = "slate", icon: Icon }: { label: string; value: number; detail: string; tone?: "slate" | "orange" | "red"; icon: typeof Package }) {
  const tones = { slate: "border-slate-200 bg-white text-[#17232b]", orange: "border-orange-200 bg-orange-50/70 text-[#c43f10]", red: "border-red-200 bg-red-50/70 text-red-700" };
  const iconTones = { slate: "bg-slate-100 text-slate-600", orange: "bg-orange-100 text-[#F95516]", red: "bg-red-100 text-red-600" };
  return <article className={`min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ${tones[tone]}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight">{value.toLocaleString("fr-FR")}</p></div><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}><Icon size={20} aria-hidden="true" /></span></div><p className="mt-2 text-xs font-medium text-slate-500">{detail}</p></article>;
}

export default function OutillagePage() {
  const { data, isLoading } = useStockAlerts();
  const outillage = data?.parCategorie.Outillage;
  const ruptures = data?.alertes.filter((reference) => reference.categorie === "Outillage" && reference.statut === "rupture").length ?? 0;

  return <AppLayout><main className="mx-auto max-w-[1500px] py-2 sm:py-4 lg:py-7">
    <BackButton href="/stock" />
    <nav aria-label="Fil d’Ariane" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500"><Link href="/stock" className="transition hover:text-[#F95516]">Stock</Link><span aria-hidden="true" className="text-slate-300">/</span><span className="text-[#17232b]">Outillage</span></nav>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#172025] text-white shadow-[0_8px_20px_rgba(23,32,37,.15)]"><Drill size={25} aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Gestion atelier · Stock</p><h1 className="mt-1 text-3xl font-black tracking-tight text-[#17232b] sm:text-4xl">Outillage</h1><p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">Consultez les références, les seuils et les niveaux de stock des outils.</p></div></div><Link href="/stock/alertes" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-[#c43f10] transition hover:-translate-y-0.5 hover:border-[#F95516] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"><CircleAlert size={19} aria-hidden="true" />Centre d’alertes<StockAlertBadge group={outillage} /></Link></div><div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-7"><p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Wrench size={15} className="text-[#F95516]" />Les alertes sont calculées automatiquement selon le stock réel et les seuils minimum configurés.</p></div></section>
    <section aria-label="Indicateurs de l’outillage" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4"><KpiCard label="Références suivies" value={outillage?.nombreReferences ?? 0} detail={isLoading ? "Chargement…" : "Références d’outillage"} icon={Package} /><KpiCard label="À traiter" value={outillage?.nombreAlertes ?? 0} detail="Sous le seuil ou en rupture" tone={(outillage?.nombreAlertes ?? 0) > 0 ? "orange" : "slate"} icon={CircleAlert} /><KpiCard label="Ruptures" value={ruptures} detail="À traiter en priorité" tone={ruptures > 0 ? "red" : "slate"} icon={TriangleAlert} /></section>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-3 sm:mt-10"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F95516]">Explorer l’outillage</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#17232b] sm:text-3xl">Choisir une famille</h2></div><p className="text-sm font-medium text-slate-500">Choisissez une famille pour consulter son stock.</p></div>
    <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">{familles.map((famille) => { const group = data?.parFamille[`Outillage:${famille.title}`]; const rupture = group?.severiteMaximale === "rupture"; return <Link key={famille.href} href={famille.href} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"><div className="relative h-44 overflow-hidden bg-slate-100"><Image src={famille.image} alt={famille.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />{group && group.nombreAlertes > 0 && <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm ${rupture ? "bg-red-600" : "bg-[#F95516]"}`}><StockAlertBadge group={group} />alerte{group.nombreAlertes > 1 ? "s" : ""}</span>}</div><div className="p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#F95516]">Suivi atelier</p><h3 className="mt-2 text-xl font-bold text-[#2F3437]">{famille.title}</h3><p className="mt-2 min-h-10 text-sm text-slate-500">{famille.detail}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-[#F95516]">Ouvrir le suivi<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-[#F95516] group-hover:text-white"><ArrowRight size={20} /></span></div></div></Link>; })}</section>
  </main></AppLayout>;
}
