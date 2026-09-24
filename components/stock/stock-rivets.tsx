"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type Rivet = {
  id: number;
  reference: string;
  designation: string;
  matiere: string;
  dimension: string;
  piecesParBoite: number;
  boitesPleines: number;
  piecesRestantes: number;
  seuilBoites: number;
};

type Modal = "ajouter" | "sortie" | "ajustement" | "supprimer" | null;

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100";

function initialForm() {
  return {
    reference: "",
    designation: "",
    matiere: "",
    dimension: "",
    piecesParBoite: "100",
    seuilBoites: "1",
  };
}

function stockTotal(item: Rivet) {
  return item.boitesPleines * item.piecesParBoite + item.piecesRestantes;
}

function stockStatut(item: Rivet) {
  const total = stockTotal(item);
  if (total === 0) return "rupture";
  if (total < item.seuilBoites * item.piecesParBoite) return "recommander";
  return "ok";
}

export default function StockRivets() {
  const [rivets, setRivets] = useState<Rivet[]>([]);
  const [recherche, setRecherche] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("tous");
  const [chargement, setChargement] = useState(true);
  const [traitement, setTraitement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [selection, setSelection] = useState<Rivet | null>(null);
  const [quantite, setQuantite] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    void chargerRivets();
  }, []);

  async function chargerRivets() {
    setChargement(true);
    setErreur("");
    const { data, error } = await supabase
      .from("stock_rivets")
      .select("*")
      .order("reference", { ascending: true });

    if (error) {
      setErreur("Le stock des rivets est indisponible. Réessayez dans un instant.");
      setChargement(false);
      return;
    }

    setRivets(
      (data ?? []).map((item) => ({
        id: item.id as number,
        reference: String(item.reference ?? ""),
        designation: String(item.designation ?? ""),
        matiere: String(item.matiere ?? "—"),
        dimension: String(item.dimension ?? "—"),
        piecesParBoite: Number(item.pieces_par_boite ?? 0),
        boitesPleines: Number(item.boites_pleines ?? 0),
        piecesRestantes: Number(item.pieces_restantes ?? 0),
        seuilBoites: Number(item.seuil_boites ?? 0),
      })),
    );
    setChargement(false);
  }

  const rivetsFiltres = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return rivets.filter((item) => {
      const correspond =
        !texte ||
        [item.reference, item.designation, item.matiere, item.dimension].some((value) =>
          value.toLowerCase().includes(texte),
        );
      return correspond && (statutFiltre === "tous" || stockStatut(item) === statutFiltre);
    });
  }, [recherche, rivets, statutFiltre]);

  const compteurs = useMemo(
    () => ({
      ok: rivets.filter((item) => stockStatut(item) === "ok").length,
      recommander: rivets.filter((item) => stockStatut(item) === "recommander").length,
      rupture: rivets.filter((item) => stockStatut(item) === "rupture").length,
    }),
    [rivets],
  );

  function fermerModal() {
    if (traitement) return;
    setModal(null);
    setSelection(null);
    setQuantite("");
  }

  function ouvrirModal(type: Modal, item?: Rivet) {
    setMessage("");
    setSelection(item ?? null);
    setQuantite(type === "ajustement" && item ? String(stockTotal(item)) : "");
    setModal(type);
  }

  async function creerReference() {
    const piecesParBoite = Number(form.piecesParBoite);
    const seuilBoites = Number(form.seuilBoites);
    if (!form.reference.trim()) return setErreur("La référence est obligatoire.");
    if (!Number.isInteger(piecesParBoite) || piecesParBoite <= 0)
      return setErreur("Indiquez un nombre de pièces par boîte supérieur à zéro.");
    if (!Number.isInteger(seuilBoites) || seuilBoites < 0)
      return setErreur("Le seuil minimum doit être un nombre positif ou nul.");

    setTraitement(true);
    setErreur("");
    const { error } = await supabase.from("stock_rivets").insert({
      reference: form.reference.trim(),
      designation: form.designation.trim(),
      matiere: form.matiere.trim() || "—",
      dimension: form.dimension.trim() || "—",
      pieces_par_boite: piecesParBoite,
      boites_pleines: 0,
      pieces_restantes: 0,
      seuil_boites: seuilBoites,
    });
    setTraitement(false);
    if (error) {
      setErreur(error.code === "23505" ? "Cette référence existe déjà." : "La référence n’a pas pu être créée.");
      return;
    }
    setForm(initialForm());
    fermerModal();
    setMessage("Référence de rivet créée.");
    await chargerRivets();
  }

  async function enregistrerQuantite() {
    if (!selection) return;
    const valeur = Number(quantite);
    const sortie = modal === "sortie";
    const nouvelleQuantite = sortie ? stockTotal(selection) - valeur : valeur;
    if (!Number.isInteger(valeur) || (sortie && valeur <= 0) || (!sortie && valeur < 0)) {
      setErreur(sortie ? "Indiquez une quantité à sortir supérieure à zéro." : "Indiquez une quantité valide.");
      return;
    }
    if (nouvelleQuantite < 0) {
      setErreur(`Stock insuffisant : ${stockTotal(selection).toLocaleString("fr-FR")} pièce(s) disponible(s).`);
      return;
    }

    setTraitement(true);
    setErreur("");
    const { error } = await supabase
      .from("stock_rivets")
      .update({
        boites_pleines: Math.floor(nouvelleQuantite / selection.piecesParBoite),
        pieces_restantes: nouvelleQuantite % selection.piecesParBoite,
      })
      .eq("id", selection.id);
    setTraitement(false);
    if (error) return setErreur("La modification du stock n’a pas pu être enregistrée.");
    fermerModal();
    setMessage(sortie ? "Sortie de stock enregistrée." : "Stock ajusté.");
    await chargerRivets();
  }

  async function supprimerReference() {
    if (!selection) return;
    setTraitement(true);
    setErreur("");
    const { error } = await supabase.from("stock_rivets").delete().eq("id", selection.id);
    setTraitement(false);
    if (error) return setErreur("La référence n’a pas pu être supprimée.");
    fermerModal();
    setMessage("Référence supprimée.");
    await chargerRivets();
  }

  const badges = {
    ok: <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700"><CheckCircle2 size={14} />STOCK OK</span>,
    recommander: <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700"><AlertTriangle size={14} />À RECOMMANDER</span>,
    rupture: <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"><XCircle size={14} />RUPTURE</span>,
  };

  return (
    <main className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><Package className="text-[#F95516]" size={32} /><h1 className="text-3xl font-bold text-[#2F3437]">Stock rivets</h1></div>
          <p className="mt-2 text-slate-500">Suivi des rivets disponibles dans l&apos;atelier.</p>
        </div>
        <button type="button" onClick={() => ouvrirModal("ajouter")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13] focus:outline-none focus:ring-2 focus:ring-orange-300"><Plus size={19} />Ajouter une référence</button>
      </div>

      {message && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{message}</div>}
      {erreur && !modal && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{erreur} <button type="button" onClick={() => void chargerRivets()} className="ml-2 underline">Réessayer</button></div>}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-xl font-bold text-[#2F3437]">Rivets en stock</h2><p className="mt-1 text-sm text-slate-500">{rivetsFiltres.length} / {rivets.length} référence(s) affichée(s)</p></div>
            <div className="grid grid-cols-3 gap-2">
              {(["ok", "recommander", "rupture"] as const).map((key) => <button key={key} type="button" onClick={() => setStatutFiltre(statutFiltre === key ? "tous" : key)} className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${statutFiltre === key ? "border-[#F95516] bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}><span className="block text-slate-500">{key === "ok" ? "OK" : key === "recommander" ? "À commander" : "Rupture"}</span><strong className="text-lg text-[#2F3437]">{compteurs[key]}</strong></button>)}
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1"><span className="sr-only">Rechercher un rivet</span><Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={19} /><input value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Référence, matière ou dimension…" className={`${inputClass} pl-10`} /></label>
            {(recherche || statutFiltre !== "tous") && <button type="button" onClick={() => { setRecherche(""); setStatutFiltre("tous"); }} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Réinitialiser</button>}
          </div>
        </div>

        {chargement ? <div className="flex items-center justify-center gap-2 p-12 text-slate-500"><Loader2 className="animate-spin" size={20} />Chargement du stock…</div> : rivetsFiltres.length === 0 ? <div className="p-12 text-center"><Package className="mx-auto text-slate-300" size={38} /><h3 className="mt-4 text-lg font-bold text-[#2F3437]">{rivets.length === 0 ? "Aucun rivet enregistré" : "Aucun résultat"}</h3><p className="mt-1 text-sm text-slate-500">{rivets.length === 0 ? "Créez votre première référence pour commencer le suivi." : "Essayez une autre recherche ou réinitialisez les filtres."}</p>{rivets.length === 0 && <button type="button" onClick={() => ouvrirModal("ajouter")} className="mt-5 rounded-xl bg-[#F95516] px-4 py-2.5 text-sm font-semibold text-white">Ajouter une référence</button>}</div> : <div className="divide-y divide-slate-100">{rivetsFiltres.map((item) => <article key={item.id} className="p-5 sm:p-6"><div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold text-[#2F3437]">{item.reference}</h3>{badges[stockStatut(item)]}</div>{item.designation && <p className="mt-1 text-sm text-slate-600">{item.designation}</p>}<div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500"><span>Matière : <strong className="text-slate-700">{item.matiere}</strong></span><span>Dimension : <strong className="text-slate-700">{item.dimension}</strong></span><span>{item.piecesParBoite} pièces / boîte</span></div><div className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1"><p><strong className="text-2xl text-[#2F3437]">{stockTotal(item).toLocaleString("fr-FR")}</strong> <span className="text-sm text-slate-500">pièces</span></p><p className="text-sm text-slate-500">{item.boitesPleines} boîte(s) pleine(s) · minimum {item.seuilBoites}</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => ouvrirModal("sortie", item)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700">Sortie</button><button type="button" onClick={() => ouvrirModal("ajustement", item)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Settings size={16} />Ajuster</button><button type="button" aria-label={`Supprimer ${item.reference}`} onClick={() => ouvrirModal("supprimer", item)} className="rounded-xl border border-red-200 p-2.5 text-red-600 hover:bg-red-50"><Trash2 size={18} /></button></div></div></article>)}</div>}
      </section>

      {modal && <div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"><section role="dialog" aria-modal="true" aria-labelledby="rivet-modal-title" className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 px-6 py-5"><div><h2 id="rivet-modal-title" className="text-xl font-bold text-[#2F3437]">{modal === "ajouter" ? "Ajouter une référence" : modal === "sortie" ? "Sortie de stock" : modal === "ajustement" ? "Ajuster le stock" : "Supprimer la référence"}</h2>{selection && <p className="mt-1 text-sm text-slate-500">{selection.reference}</p>}</div><button type="button" aria-label="Fermer" disabled={traitement} onClick={fermerModal} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X size={21} /></button></header><div className="space-y-4 px-6 py-6">{erreur && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{erreur}</p>}{modal === "ajouter" ? <><label className="block text-sm font-semibold text-slate-700">Référence<input autoFocus value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} className={`${inputClass} mt-1.5`} placeholder="Ex. RIV-POP-INOX-4X10" /></label><label className="block text-sm font-semibold text-slate-700">Désignation <span className="font-normal text-slate-400">(facultatif)</span><input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} className={`${inputClass} mt-1.5`} placeholder="Rivet aveugle tête large" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-slate-700">Matière<input value={form.matiere} onChange={(event) => setForm({ ...form, matiere: event.target.value })} className={`${inputClass} mt-1.5`} placeholder="Inox" /></label><label className="text-sm font-semibold text-slate-700">Dimension<input value={form.dimension} onChange={(event) => setForm({ ...form, dimension: event.target.value })} className={`${inputClass} mt-1.5`} placeholder="Ø 4 × 10" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-slate-700">Pièces / boîte<input type="number" min="1" inputMode="numeric" value={form.piecesParBoite} onChange={(event) => setForm({ ...form, piecesParBoite: event.target.value })} className={`${inputClass} mt-1.5`} /></label><label className="text-sm font-semibold text-slate-700">Seuil (boîtes)<input type="number" min="0" inputMode="numeric" value={form.seuilBoites} onChange={(event) => setForm({ ...form, seuilBoites: event.target.value })} className={`${inputClass} mt-1.5`} /></label></div></> : modal === "supprimer" ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">La référence <strong>{selection?.reference}</strong> sera définitivement supprimée du stock.</div> : <><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Stock actuel</p><strong className="text-2xl text-[#2F3437]">{selection && stockTotal(selection).toLocaleString("fr-FR")} pièces</strong></div><label className="block text-sm font-semibold text-slate-700">{modal === "sortie" ? "Quantité à sortir" : "Nouveau stock réel"}<input autoFocus type="number" min="0" inputMode="numeric" value={quantite} onChange={(event) => setQuantite(event.target.value)} className={`${inputClass} mt-1.5 text-lg`} /></label></>}<div className="flex justify-end gap-3 pt-2"><button type="button" disabled={traitement} onClick={fermerModal} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-60">Annuler</button><button type="button" disabled={traitement} onClick={modal === "ajouter" ? creerReference : modal === "supprimer" ? supprimerReference : enregistrerQuantite} className={`inline-flex min-w-28 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 ${modal === "supprimer" ? "bg-red-600 hover:bg-red-700" : "bg-[#F95516] hover:bg-[#e04d13]"}`}>{traitement ? <Loader2 className="animate-spin" size={18} /> : modal === "supprimer" ? "Supprimer" : modal === "ajouter" ? "Créer" : "Enregistrer"}</button></div></div></section></div>}
    </main>
  );
}
