"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  History,
  Loader2,
  PackageCheck,
  Search,
  UserRound,
} from "lucide-react";
import type { CommandeSuivi, StatutCommandeSuivi } from "@/lib/commande-suivi";
import type { CommandeSuiviResume } from "@/lib/commande-receptions-server";

type Feedback = { type: "error" | "success"; message: string } | null;
type FiltreStatut = "Toutes" | StatutCommandeSuivi;

const STATUTS: FiltreStatut[] = ["Toutes", "En attente", "Partiellement livrée", "Livrée", "Annulée"];

const statusStyle: Record<StatutCommandeSuivi, string> = {
  "En attente": "bg-amber-50 text-amber-800 ring-amber-200",
  "Partiellement livrée": "bg-blue-50 text-blue-800 ring-blue-200",
  "Livrée": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Annulée": "bg-rose-50 text-rose-800 ring-rose-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));
}

function formatDateLong(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(value));
}

function dateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function statusRank(status: StatutCommandeSuivi) {
  return status === "En attente" ? 0 : status === "Partiellement livrée" ? 1 : status === "Livrée" ? 2 : 3;
}

export default function CommandesSuiviClient() {
  const [commandes, setCommandes] = useState<CommandeSuiviResume[]>([]);
  const [commande, setCommande] = useState<CommandeSuivi | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<FiltreStatut>("Toutes");
  const [demandeur, setDemandeur] = useState("Toutes les personnes");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [tab, setTab] = useState<"articles" | "informations" | "historique">("articles");
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  const [commentaireReception, setCommentaireReception] = useState("");
  const [enregistrePar, setEnregistrePar] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function chargerListe() {
    setLoadingList(true);
    try {
      const response = await fetch("/api/commandes", { cache: "no-store" });
      const result: { commandes?: CommandeSuiviResume[]; message?: string } = await response.json();
      if (!response.ok) throw new Error(result.message);
      const liste = result.commandes ?? [];
      setCommandes(liste);
      setSelectedId((current) => current ?? [...liste].sort((a, b) => statusRank(a.statut) - statusRank(b.statut))[0]?.id ?? null);
    } catch {
      setFeedback({ type: "error", message: "Impossible de charger le suivi des commandes. Réessayez." });
    } finally {
      setLoadingList(false);
    }
  }

  async function chargerDetail(id: string) {
    setLoadingDetail(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/commandes/${id}/receptions`, { cache: "no-store" });
      const result: { commande?: CommandeSuivi; message?: string } = await response.json();
      if (!response.ok || !result.commande) throw new Error(result.message);
      setCommande(result.commande);
      setQuantites(Object.fromEntries(result.commande.lignes.map((ligne) => [ligne.id, 0])));
      setCommentaireReception("");
      setEnregistrePar("");
      setTab("articles");
    } catch {
      setCommande(null);
      setFeedback({ type: "error", message: "Impossible de charger cette commande." });
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    const request = window.setTimeout(() => { void chargerListe(); }, 0);
    return () => window.clearTimeout(request);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const request = window.setTimeout(() => { void chargerDetail(selectedId); }, 0);
    return () => window.clearTimeout(request);
  }, [selectedId]);

  const demandeurs = useMemo(
    () => [...new Set(commandes.map((item) => item.demandeur).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [commandes]
  );

  const commandesFiltrees = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return commandes
      .filter((item) => statut === "Toutes" || item.statut === statut)
      .filter((item) => demandeur === "Toutes les personnes" || item.demandeur === demandeur)
      .filter((item) => !dateDebut || dateKey(item.dateCommande) >= dateDebut)
      .filter((item) => !dateFin || dateKey(item.dateCommande) <= dateFin)
      .filter((item) => !query || `${item.numero} ${item.demandeur}`.toLocaleLowerCase("fr").includes(query))
      .sort((a, b) => statusRank(a.statut) - statusRank(b.statut) || new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime());
  }, [commandes, dateDebut, dateFin, demandeur, search, statut]);

  const compteStatut = (value: FiltreStatut) => value === "Toutes" ? commandes.length : commandes.filter((item) => item.statut === value).length;
  const totalSaisi = commande?.lignes.reduce((total, ligne) => total + (quantites[ligne.id] ?? 0), 0) ?? 0;
  const lignesReceptionnables = commande?.lignes.filter((ligne) => ligne.quantiteRestante > 0) ?? [];

  function setQuantite(ligneId: string, valeur: number, maximum: number) {
    setQuantites((current) => ({ ...current, [ligneId]: Math.max(0, Math.min(maximum, Number.isFinite(valeur) ? Math.trunc(valeur) : 0)) }));
  }

  function receptionnerTout() {
    if (!commande) return;
    setQuantites(Object.fromEntries(commande.lignes.map((ligne) => [ligne.id, ligne.quantiteRestante])));
  }

  async function enregistrerReception() {
    if (!commande || saving) return;
    const lignes = commande.lignes
      .map((ligne) => ({ commandeArticleId: ligne.id, quantiteRecue: quantites[ligne.id] ?? 0 }))
      .filter((ligne) => ligne.quantiteRecue > 0);

    if (!lignes.length) {
      setFeedback({ type: "error", message: "Indiquez au moins une quantité reçue avant d’enregistrer." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/commandes/${commande.id}/receptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lignes,
          commentaire: commentaireReception,
          enregistrePar,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const result: { commande?: CommandeSuivi; message?: string } = await response.json();
      if (!response.ok || !result.commande) throw new Error(result.message);

      setCommande(result.commande);
      setQuantites(Object.fromEntries(result.commande.lignes.map((ligne) => [ligne.id, 0])));
      setCommentaireReception("");
      setEnregistrePar("");
      setFeedback({ type: "success", message: "Réception enregistrée. Les reliquats et le statut ont été mis à jour." });
      await chargerListe();
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error && error.message ? error.message : "La réception n’a pas pu être enregistrée." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] pb-3">
      <section className="relative overflow-hidden rounded-2xl bg-[#142026] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-7" style={{ backgroundImage: "linear-gradient(90deg, rgba(10,20,26,.96), rgba(10,20,26,.70), rgba(10,20,26,.36)), url('/category-outils-coupe-v1.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff8d5c]">Commande atelier</p>
        <h2 className="mt-2 !text-white text-3xl font-black sm:text-4xl">Suivi des commandes</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-100 sm:text-base">Consultez les demandes, enregistrez les réceptions et suivez les reliquats à commander.</p>
      </section>

      <div className="mt-5 overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Filtrer les commandes par statut">
          {STATUTS.map((item) => <button key={item} type="button" role="tab" aria-selected={statut === item} onClick={() => setStatut(item)} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${statut === item ? "border-[#F95516] text-[#F95516]" : "border-transparent text-slate-600 hover:text-slate-950"}`}>{item} <span className="ml-1 text-xs text-slate-400">({compteStatut(item)})</span></button>)}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[31rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-[6.1rem] xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une commande…" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100" /></label>
            <select value={demandeur} onChange={(event) => setDemandeur(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#F95516]"><option>Toutes les personnes</option>{demandeurs.map((item) => <option key={item}>{item}</option>)}</select>
            <label className="text-xs font-medium text-slate-500">Du<input type="date" value={dateDebut} onChange={(event) => setDateDebut(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-[#F95516]" /></label>
            <label className="text-xs font-medium text-slate-500">Au<input type="date" value={dateFin} onChange={(event) => setDateFin(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-[#F95516]" /></label>
          </div>

          <div className="mt-3 space-y-2" aria-live="polite">
            {loadingList ? (
              <div className="flex min-h-32 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={18} /> Chargement…</div>
            ) : commandesFiltrees.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Aucune commande ne correspond à ces filtres.</div>
            ) : commandesFiltrees.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selectedId === item.id ? "border-[#F95516] bg-orange-50/60 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}>
                <ChevronRight size={17} className={selectedId === item.id ? "text-[#F95516]" : "text-slate-400"} />
                <span className="min-w-0 flex-1"><span className="block font-bold text-slate-900">{item.numero}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{item.demandeur} · {formatDate(item.dateCommande)}</span><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#F95516]" style={{ width: `${item.progression}%` }} /></span></span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusStyle[item.statut]}`}>{item.statut}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingDetail ? <div className="flex min-h-[34rem] items-center justify-center text-slate-500"><Loader2 className="mr-2 animate-spin" size={20} /> Chargement de la commande…</div> : !commande ? <div className="flex min-h-[34rem] flex-col items-center justify-center p-8 text-center"><ClipboardCheck size={44} className="text-slate-300" /><h3 className="mt-4 text-lg font-bold text-slate-800">Sélectionnez une commande</h3><p className="mt-1 max-w-sm text-sm text-slate-500">Son détail, ses reliquats et son historique de réception apparaîtront ici.</p></div> : <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
              <div><div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl font-black text-[#121820]">{commande.numero}</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusStyle[commande.statut]}`}>{commande.statut}</span></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span>{formatDateLong(commande.dateCommande)}</span><span className="inline-flex items-center gap-1"><UserRound size={15} /> {commande.demandeur}</span><span>{commande.lignes.length} référence{commande.lignes.length > 1 ? "s" : ""}</span></div></div>
              <a href={`/api/commandes/${commande.id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50"><FileText size={18} /> PDF</a>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-6">
              <div className="flex" role="tablist">
                {(["articles", "informations", "historique"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={`border-b-2 px-3 py-4 text-sm font-bold ${tab === value ? "border-[#F95516] text-[#F95516]" : "border-transparent text-slate-500"}`}
                  >
                    {value === "historique" && <History className="mr-1 inline" size={15} />}
                    {value === "articles" ? "Articles" : value === "informations" ? "Informations" : "Historique"}
                  </button>
                ))}
              </div>
              <div className="min-w-44 text-right">
                <p className="text-xs font-semibold text-slate-500">Réception : {commande.quantiteRecue} / {commande.quantiteCommandee}</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${commande.progression}%` }} /></div>
              </div>
            </div>

            {feedback && <div role="status" className={`mx-5 mt-5 rounded-xl border px-4 py-3 text-sm font-medium sm:mx-6 ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{feedback.message}</div>}

            {tab === "articles" && <div className="overflow-x-auto"><table className="min-w-[780px] w-full text-left"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="w-12 px-4 py-4"></th><th className="px-3 py-4">Article</th><th className="px-3 py-4 text-center">Commandé</th><th className="px-3 py-4 text-center">Déjà reçu</th><th className="px-3 py-4 text-center">Reçu maintenant</th><th className="px-3 py-4 text-center">Reste</th><th className="px-3 py-4">Statut</th></tr></thead><tbody>{commande.lignes.map((ligne) => {
              const maintenant = quantites[ligne.id] ?? 0;
              const terminee = ligne.quantiteRestante === 0;
              const resteApres = ligne.quantiteRestante - maintenant;
              return <tr key={ligne.id} className={`border-b border-slate-100 ${terminee ? "bg-emerald-50/60" : "bg-white"}`}><td className="px-4 py-4"><input type="checkbox" checked={terminee || (ligne.quantiteRestante > 0 && maintenant === ligne.quantiteRestante)} disabled={terminee || commande.estAnnulee} onChange={(event) => setQuantite(ligne.id, event.target.checked ? ligne.quantiteRestante : 0, ligne.quantiteRestante)} className="h-5 w-5 rounded border-slate-300 text-[#F95516] focus:ring-[#F95516] disabled:opacity-70" aria-label={`Réceptionner entièrement ${ligne.article}`} /></td><td className="px-3 py-4"><p className={`font-bold ${terminee ? "text-emerald-900" : "text-slate-900"}`}>{ligne.article}</p>{ligne.variante && <p className="mt-1 text-xs text-slate-500">{ligne.variante}</p>}{ligne.famille && <p className="mt-1 text-xs text-slate-500">{ligne.famille}</p>}</td><td className="px-3 py-4 text-center font-bold text-slate-800">{ligne.quantiteCommandee}</td><td className="px-3 py-4 text-center font-bold text-slate-700">{ligne.quantiteRecue}</td><td className="px-3 py-4 text-center"><input type="number" min={0} max={ligne.quantiteRestante} value={maintenant} disabled={terminee || commande.estAnnulee} onChange={(event) => setQuantite(ligne.id, Number(event.target.value), ligne.quantiteRestante)} className="h-10 w-20 rounded-lg border border-slate-200 bg-white px-2 text-center font-bold outline-none focus:border-[#F95516] disabled:cursor-not-allowed disabled:bg-slate-100" aria-label={`Quantité reçue maintenant pour ${ligne.article}`} /></td><td className="px-3 py-4 text-center font-black text-slate-800">{resteApres}</td><td className="px-3 py-4">{terminee ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"><CheckCircle2 size={14} /> Réceptionnée</span> : maintenant > 0 ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">À enregistrer</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">En attente</span>}</td></tr>;
            })}</tbody></table></div>}

            {tab === "informations" && <div className="p-6"><h4 className="font-bold text-slate-900">Commentaire de la commande</h4><p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{commande.commentaire || "Aucun commentaire ajouté à cette commande."}</p></div>}
            {tab === "historique" && <div className="p-5 sm:p-6">{commande.receptions.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-7 text-center text-sm text-slate-500">Aucune réception n’a encore été enregistrée.</div> : <ol className="space-y-3">{commande.receptions.map((reception) => <li key={reception.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-900">Réception du {formatDateLong(reception.dateReception)}</p>{reception.enregistrePar && <p className="text-sm text-slate-500">Saisie par {reception.enregistrePar}</p>}</div><ul className="mt-3 space-y-1 text-sm text-slate-600">{reception.lignes.map((ligne) => { const article = commande.lignes.find((item) => item.id === ligne.commandeArticleId); return <li key={ligne.id}>+ {ligne.quantiteRecue} — {article?.article ?? "Article"}</li>; })}</ul>{reception.commentaire && <p className="mt-3 border-t border-slate-100 pt-3 text-sm italic text-slate-600">{reception.commentaire}</p>}</li>)}</ol>}</div>}

            {tab === "articles" && <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 font-bold text-slate-900"><PackageCheck size={20} className="text-[#F95516]" /> Validation de la réception</div><button type="button" onClick={receptionnerTout} disabled={!lignesReceptionnables.length || commande.estAnnulee || saving} className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60">Réceptionner tous les articles</button></div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_13rem]"><textarea value={commentaireReception} onChange={(event) => setCommentaireReception(event.target.value)} maxLength={1000} placeholder="Ajouter un commentaire de réception (facultatif)…" className="min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100" /><input value={enregistrePar} onChange={(event) => setEnregistrePar(event.target.value)} maxLength={100} placeholder="Saisi par (facultatif)" className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#F95516]" /></div><button type="button" onClick={enregistrerReception} disabled={!totalSaisi || commande.estAnnulee || saving} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F95516] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#e84a0e] disabled:cursor-not-allowed disabled:opacity-60"><Check size={19} />{saving ? "Enregistrement…" : `Enregistrer la réception${totalSaisi ? ` (${totalSaisi})` : ""}`}</button>{commande.estAnnulee && <p className="mt-3 text-sm font-medium text-rose-700">Cette commande est annulée : aucune réception ne peut être ajoutée.</p>}</div>}
          </>}
        </section>
      </div>
    </div>
  );
}
