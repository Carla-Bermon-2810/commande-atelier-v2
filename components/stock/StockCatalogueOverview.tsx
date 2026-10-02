"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Box, CircleAlert, Disc3, Flame, HardHat, Loader2, Package, TriangleAlert, type LucideIcon } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockAlertBadge from "@/components/stock/StockAlertBadge";
import type { StockArticleCatalogue, StockCatalogueType } from "@/lib/stock-articles-catalogue";
import { useStockAlerts } from "@/lib/stock-alerts-client";

type FamilyVisual = { image: string };

const pages: Record<StockCatalogueType, {
  title: string;
  description: string;
  icon: LucideIcon;
  iconHint: string;
  fallbackImage: string;
  familyVisuals: Record<string, FamilyVisual>;
}> = {
  abrasifs: {
    title: "Abrasifs",
    description: "Consultez les références abrasives, leurs seuils et les quantités réellement relevées dans l’atelier.",
    icon: Disc3,
    iconHint: "Les alertes sont calculées à partir des quantités réellement initialisées et de leurs seuils.",
    fallbackImage: "/category-abrasif-v1.png",
    familyVisuals: {
      "Bandes abrasives": { image: "/family-bandes-abrasives-v1.png" },
      "Brosses métalliques": { image: "/family-brosses-metalliques-v1.png" },
      Disques: { image: "/family-disques-v1.png" },
      "Plateau ponceuse": { image: "/family-plateaux-ponceuse-v1.png" },
      Roues: { image: "/family-roues-v1.png" },
      Satinage: { image: "/family-satinage-v1.png" },
    },
  },
  soudure: {
    title: "Soudure",
    description: "Consommables et équipements de soudure suivis depuis les relevés réels de l’atelier.",
    icon: Flame,
    iconHint: "Les alertes sont calculées à partir des quantités initialisées et des seuils configurés.",
    fallbackImage: "/category-soudure-v1.png",
    familyVisuals: {},
  },
  epi: {
    title: "EPI",
    description: "Équipements de protection suivis uniquement après leur initialisation à partir du stock réel.",
    icon: HardHat,
    iconHint: "Une référence à initialiser reste distincte d’une alerte ou d’une rupture Stock.",
    fallbackImage: "/category-epi-v1.png",
    familyVisuals: {},
  },
  consommables: {
    title: "Consommables",
    description: "Produits d’atelier, nettoyage et accessoires disponibles pour le suivi de Stock.",
    icon: Box,
    iconHint: "Les alertes sont calculées à partir des quantités initialisées et des seuils configurés.",
    fallbackImage: "/category-consommable-v1.png",
    familyVisuals: {},
  },
};

function familySlug(value: string) {
  return value.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function KpiCard({ label, value, detail, icon: Icon, tone = "slate" }: { label: string; value: number; detail: string; icon: LucideIcon; tone?: "slate" | "orange" | "red" | "neutral" }) {
  const tones = { slate: "border-slate-200 bg-white text-[#17232b]", orange: "border-orange-200 bg-orange-50/70 text-[#c43f10]", red: "border-red-200 bg-red-50/70 text-red-700", neutral: "border-slate-200 bg-slate-50 text-slate-600" };
  const iconTones = { slate: "bg-slate-100 text-slate-600", orange: "bg-orange-100 text-[#F95516]", red: "bg-red-100 text-red-600", neutral: "bg-slate-200 text-slate-600" };
  return <article className={`min-w-0 rounded-2xl border px-3.5 py-3 shadow-sm sm:px-4 sm:py-3.5 ${tones[tone]}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight sm:text-[1.7rem]">{value.toLocaleString("fr-FR")}</p></div><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}><Icon size={17} aria-hidden="true" /></span></div><p className="mt-1 text-xs font-medium text-slate-500">{detail}</p></article>;
}

export default function StockCatalogueOverview({ type }: { type: StockCatalogueType }) {
  const page = pages[type];
  const Icon = page.icon;
  const { data: alertes, isLoading: alertsLoading } = useStockAlerts();
  const [articles, setArticles] = useState<StockArticleCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/stock/articles-catalogue?type=${type}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { articles?: StockArticleCatalogue[]; message?: string };
        if (!response.ok) throw new Error(payload.message || "Impossible de charger les références.");
        if (active) setArticles(payload.articles ?? []);
      })
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : "Impossible de charger les références."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [type]);

  const familyCards = useMemo(() => {
    const byFamily = new Map<string, StockArticleCatalogue[]>();
    articles.forEach((article) => byFamily.set(article.famille, [...(byFamily.get(article.famille) ?? []), article]));
    return [...byFamily.entries()].map(([family, familyArticles]) => {
      const group = alertes?.parFamille[`${page.title}:${family}`];
      const firstPhoto = familyArticles.find((article) => article.photo)?.photo;
      return { family, articles: familyArticles, group, image: firstPhoto || page.familyVisuals[family]?.image || page.fallbackImage };
    }).sort((left, right) => left.family.localeCompare(right.family, "fr"));
  }, [alertes?.parFamille, articles, page]);

  const references = alertes?.references.filter((reference) => reference.source === type) ?? [];
  const tracked = references.length;
  const toProcess = references.filter((reference) => reference.statut === "a_recommander" || reference.statut === "rupture").length;
  const ruptures = references.filter((reference) => reference.statut === "rupture").length;
  const toInitialize = articles.filter((article) => article.etatInitialisation === "a_initialiser").length;
  const group = alertes?.parCategorie[page.title];

  return <AppLayout><main className="mx-auto max-w-[1500px] py-2 sm:py-3 lg:py-5">
    <BackButton href="/stock" />
    <nav aria-label="Fil d’Ariane" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500"><Link href="/stock" className="transition hover:text-[#F95516]">Stock</Link><span aria-hidden="true" className="text-slate-300">/</span><span className="text-[#17232b]">{page.title}</span></nav>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 px-5 py-4 sm:px-7 sm:py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-3.5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#172025] text-white shadow-[0_8px_20px_rgba(23,32,37,.15)]"><Icon size={23} aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Gestion atelier · Stock</p><h1 className="mt-0.5 text-3xl font-black tracking-tight text-[#17232b] sm:text-[2.15rem]">{page.title}</h1><p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{page.description}</p></div></div><Link href="/stock/alertes" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-[#c43f10] transition hover:-translate-y-0.5 hover:border-[#F95516] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"><CircleAlert size={19} aria-hidden="true" />Centre d’alertes<StockAlertBadge group={group} /></Link></div><div className="border-t border-slate-100 bg-slate-50/70 px-5 py-2 sm:px-7"><p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Icon size={15} className="text-[#F95516]" />{page.iconHint}</p></div></section>
    <section aria-label={`Indicateurs ${page.title}`} className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3"><KpiCard label="Références initialisées" value={tracked} detail={alertsLoading ? "Chargement…" : "Stock déjà relevé dans l’atelier"} icon={Package} /><KpiCard label="À traiter" value={toProcess} detail="Sous le seuil ou en rupture" tone={toProcess > 0 ? "orange" : "slate"} icon={CircleAlert} /><KpiCard label="Ruptures" value={ruptures} detail="À traiter en priorité" tone={ruptures > 0 ? "red" : "slate"} icon={TriangleAlert} /><KpiCard label="À initialiser" value={toInitialize} detail={loading ? "Chargement…" : "Références sans quantité relevée"} tone="neutral" icon={Box} /></section>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-3 sm:mt-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F95516]">Explorer les {page.title.toLocaleLowerCase("fr-FR")}</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#17232b] sm:text-3xl">Choisir une famille</h2></div><Link href={`/stock/${type}/toutes`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#17232b] shadow-sm transition hover:border-orange-200 hover:text-[#F95516] focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2">Voir toutes les références<ArrowRight size={16} aria-hidden="true" /></Link></div>
    {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{error}</div> : loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={20} />Chargement des familles…</div> : <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">{familyCards.map((familyCard) => { const rupture = familyCard.group?.severiteMaximale === "rupture"; return <Link key={familyCard.family} href={`/stock/${type}/${familySlug(familyCard.family)}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"><div className="relative h-44 overflow-hidden bg-slate-100" style={{ backgroundImage: `url("${familyCard.image}")`, backgroundPosition: "center", backgroundSize: "cover" }}><div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,23,.02)_0%,rgba(10,18,23,.45)_100%)]" />{familyCard.group && familyCard.group.nombreAlertes > 0 && <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm ${rupture ? "bg-red-600" : "bg-[#F95516]"}`}><StockAlertBadge group={familyCard.group} />alerte{familyCard.group.nombreAlertes > 1 ? "s" : ""}</span>}</div><div className="p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#F95516]">Suivi atelier</p><h3 className="mt-2 text-xl font-bold text-[#2F3437]">{familyCard.family}</h3><p className="mt-2 min-h-5 text-sm text-slate-500">{familyCard.articles.length} référence{familyCard.articles.length > 1 ? "s" : ""}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-[#F95516]">Ouvrir le suivi<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-[#F95516] group-hover:text-white"><ArrowRight size={20} /></span></div></div></Link>; })}</section>}
  </main></AppLayout>;
}
