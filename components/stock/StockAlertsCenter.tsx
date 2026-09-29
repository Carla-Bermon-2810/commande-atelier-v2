"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Box, Loader2, PackagePlus, Search, TriangleAlert } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { StockOrderButton } from "@/components/cart/StockOrderButton";
import { stockAlertStatusLabel } from "@/lib/stock-alerts";
import { useStockAlerts, type StockAlertView } from "@/lib/stock-alerts-client";

function StatusBadge({ alert }: { alert: StockAlertView }) {
  const rupture = alert.statut === "rupture";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${rupture ? "bg-red-100 text-red-700" : "bg-orange-100 text-[#bd3d10]"}`}>
    {rupture ? <TriangleAlert size={14} /> : <AlertTriangle size={14} />}{stockAlertStatusLabel(alert.statut)}
  </span>;
}

export default function StockAlertsCenter() {
  const { data, isLoading } = useStockAlerts();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "a_recommander" | "rupture">("all");
  const [category, setCategory] = useState("all");
  const [family, setFamily] = useState("all");

  const alerts = (data?.alertes ?? []).filter((alert) => {
    const matchesSearch = [alert.libelle, alert.referenceKey, alert.categorie, alert.famille].join(" ").toLocaleLowerCase("fr-FR").includes(search.trim().toLocaleLowerCase("fr-FR"));
    return matchesSearch && (status === "all" || alert.statut === status) && (category === "all" || alert.categorie === category) && (family === "all" || alert.famille === family);
  });
  const categories = Array.from(new Set((data?.alertes ?? []).map((alert) => alert.categorie)));
  const families = Array.from(new Set((data?.alertes ?? []).filter((alert) => category === "all" || alert.categorie === category).map((alert) => alert.famille))).sort((a, b) => a.localeCompare(b, "fr"));

  return <AppLayout>
    <div className="mx-auto max-w-[1500px] py-2 sm:py-4">
      <section className="overflow-hidden rounded-2xl bg-[#142026] p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8d5c]">Stock atelier</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-3xl font-black sm:text-4xl">Centre d’alertes</h1><p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">Les références à traiter, calculées à partir du stock réel et de leurs seuils.</p></div>
          <Link href="/stock" className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-bold hover:bg-white/10">Retour au stock</Link>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><span className="sr-only">Rechercher une référence</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une référence ou une désignation…" className="min-h-11 w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100" /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><option value="all">Toutes les alertes</option><option value="rupture">Ruptures</option><option value="a_recommander">À recommander</option></select>
          <select value={category} onChange={(event) => { setCategory(event.target.value); setFamily("all"); }} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><option value="all">Toutes les catégories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select value={family} onChange={(event) => setFamily(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"><option value="all">Toutes les familles</option>{families.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
      </section>

      {isLoading ? <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500"><Loader2 className="animate-spin" /> Chargement des alertes…</div> : alerts.length === 0 ? <section className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Box className="mx-auto text-emerald-600" size={42} /><h2 className="mt-4 text-xl font-bold text-[#17232b]">Aucune référence à traiter</h2><p className="mt-2 text-sm text-slate-500">Les ruptures et les références sous leur seuil apparaîtront ici.</p></section> : <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-600">{alerts.length} référence{alerts.length > 1 ? "s" : ""} à traiter · les ruptures sont affichées en premier</div>
        <div className="divide-y divide-slate-100">{alerts.map((alert) => <article key={alert.id} className={`flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center ${alert.statut === "rupture" ? "bg-red-50/45" : "bg-orange-50/35"}`}>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white"><PackagePlus className="text-slate-300" size={27} /></div>
            <div className="min-w-0"><h2 className="truncate font-bold text-[#17232b]">{alert.libelle}</h2><p className="mt-1 text-xs font-medium text-slate-500">{alert.categorie} · {alert.famille} · Réf. {alert.referenceKey}</p><div className="mt-2 lg:hidden"><StatusBadge alert={alert} /></div></div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm lg:min-w-[300px]"><div><p className="text-xs text-slate-500">Stock actuel</p><p className="mt-1 font-bold text-[#17232b]">{alert.stockActuel.toLocaleString("fr-FR")} {alert.unite}</p></div><div><p className="text-xs text-slate-500">Seuil</p><p className="mt-1 font-bold text-[#17232b]">{alert.seuil === null ? "Non défini" : `${alert.seuil.toLocaleString("fr-FR")} ${alert.unite}`}</p></div><div className="hidden lg:block"><p className="text-xs text-slate-500">Statut</p><div className="mt-1"><StatusBadge alert={alert} /></div></div></div>
          <div className="flex shrink-0 gap-2"><Link href={alert.stockUrl} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-white">Voir</Link><StockOrderButton compact target={{ source: alert.source, referenceKey: alert.referenceKey, article: alert.libelle, famille: alert.famille, stockActuel: alert.stockActuel, seuil: alert.seuil, uniteStock: alert.unite, piecesParBoite: alert.piecesParBoite }} /></div>
        </article>)}</div>
      </section>}
    </div>
  </AppLayout>;
}
