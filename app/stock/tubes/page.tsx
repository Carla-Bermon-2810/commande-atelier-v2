"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CircleAlert, Package, Ruler, TriangleAlert } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockAlertBadge from "@/components/stock/StockAlertBadge";
import { useStockAlerts } from "@/lib/stock-alerts-client";

const matieres = [
  { href: "/stock/tubes/acier", title: "Acier", image: "/tube acier.png", detail: "Sections et longueurs acier" },
  { href: "/stock/tubes/inox", title: "Inox", image: "/tube inox.png", detail: "Sections et longueurs inox" },
  { href: "/stock/tubes/alu", title: "Aluminium", image: "/tube alu.png", detail: "Sections et longueurs aluminium" },
];

function KpiCard({ label, value, detail, tone = "slate", icon: Icon }: {
  label: string;
  value: number;
  detail: string;
  tone?: "slate" | "orange" | "red";
  icon: typeof Package;
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-[#17232b]",
    orange: "border-orange-200 bg-orange-50/70 text-[#c43f10]",
    red: "border-red-200 bg-red-50/70 text-red-700",
  };
  const iconTones = {
    slate: "bg-slate-100 text-slate-600",
    orange: "bg-orange-100 text-[#F95516]",
    red: "bg-red-100 text-red-600",
  };

  return (
    <article className={`min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value.toLocaleString("fr-FR")}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTones[tone]}`}>
          <Icon size={20} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p>
    </article>
  );
}

export default function TubesPage() {
  const { data, isLoading } = useStockAlerts();
  const tubes = data?.parCategorie.Tubes;

  return (
    <AppLayout>
      <main className="mx-auto max-w-[1500px] py-2 sm:py-4 lg:py-7">
        <BackButton href="/stock" />

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#172025] text-white shadow-[0_8px_20px_rgba(23,32,37,.15)]">
                <Ruler size={25} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Gestion atelier · Stock</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-[#17232b] sm:text-4xl">Tubes</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">Choisissez une matière pour consulter les longueurs disponibles et les seuils de stock.</p>
              </div>
            </div>
            <Link href="/stock/alertes" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-[#c43f10] transition hover:-translate-y-0.5 hover:border-[#F95516] hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2">
              <CircleAlert size={19} aria-hidden="true" />
              Centre d’alertes
              <StockAlertBadge group={tubes} />
            </Link>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 sm:px-7">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Ruler size={15} className="text-[#F95516]" /> Les alertes de tubes sont calculées sur la longueur totale disponible par référence.</p>
          </div>
        </section>

        <section aria-label="Indicateurs des tubes" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
          <KpiCard label="Références suivies" value={tubes?.nombreReferences ?? 0} detail={isLoading ? "Chargement…" : "Références de tubes"} icon={Package} />
          <KpiCard label="À traiter" value={tubes?.nombreAlertes ?? 0} detail="Sous le seuil ou en rupture" tone="orange" icon={CircleAlert} />
          <KpiCard label="Ruptures" value={data?.alertes.filter((reference) => reference.source === "tubes" && reference.statut === "rupture").length ?? 0} detail="À traiter en priorité" tone="red" icon={TriangleAlert} />
        </section>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-3 sm:mt-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F95516]">Explorer les tubes</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#17232b] sm:text-3xl">Choisir une matière</h2>
          </div>
          <p className="text-sm font-medium text-slate-500">Les longueurs et alertes sont mises à jour automatiquement.</p>
        </div>

        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {matieres.map((matiere) => {
            const group = data?.parFamille[`Tubes:${matiere.title}`];
            const rupture = group?.severiteMaximale === "rupture";
            return (
              <Link key={matiere.href} href={matiere.href} className="group relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 bg-[#172025] p-5 text-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F95516] sm:min-h-[20rem]">
                <Image src={matiere.image} alt="" fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,18,23,.08)_0%,rgba(10,18,23,.14)_32%,rgba(10,18,23,.78)_72%,rgba(10,18,23,.97)_100%)]" />
                <div className="absolute left-4 top-4 z-10 flex max-w-[calc(100%-2rem)] items-center gap-2">
                  <span className="rounded-full bg-[#172025]/80 px-3 py-1.5 text-[11px] font-bold text-slate-100 backdrop-blur-sm">Tubes {matiere.title.toLocaleLowerCase("fr-FR")}</span>
                  {group && group.nombreAlertes > 0 && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm ${rupture ? "bg-red-600" : "bg-[#F95516]"}`}>
                      <StockAlertBadge group={group} />alertes
                    </span>
                  )}
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff9b76]">Matière</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-white">{matiere.title}</h3>
                  <p className="mt-1 min-h-10 text-sm leading-snug text-slate-200">{matiere.detail}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4">
                    <span className="text-sm font-bold text-white">Ouvrir le suivi</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F95516] text-white transition-transform group-hover:translate-x-1"><ArrowRight size={19} aria-hidden="true" /></span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </AppLayout>
  );
}
