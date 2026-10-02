"use client";

import { supabase } from "@/lib/supabase";
import { notifyStockAlertsUpdated } from "@/lib/stock-alerts-client";
import { StockOrderButton } from "@/components/cart/StockOrderButton";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleGauge,
  Minus,
  Package,
  Pencil,
  Plus,
  Ruler,
  Search,
  Settings,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type Vis = {
  id: number;
  reference: string;
  designation: string;
  matiere: string;
  typeTete: string;
  dimension: string;
  piecesParBoite: number;
  boitesPleines: number;
  piecesRestantes: number;
  seuilBoites: number;
};

const MATIERES_VIS = ["Inox", "Acier", "Zingué"] as const;

const TYPES_TETE = [
  { value: "FHC", label: "FHC — tête fraisée" },
  { value: "BHC", label: "BHC — tête bombée" },
  { value: "CHC", label: "CHC — cylindrique hexagonale" },
  { value: "TH", label: "TH — tête hexagonale" },
] as const;

const VISUEL_PAR_TETE: Record<string, string> = {
  TH: "/vis-th-v2.png",
  FHC: "/vis-fhc-v2.png",
  BHC: "/vis-bhc-v2.png",
  CHC: "/vis-chc-v2.png",
};

function visuelVis(typeTete?: string) {
  return VISUEL_PAR_TETE[typeTete ?? ""] ?? "/vis-chc-v2.png";
}

function typeTeteLabel(value: string) {
  return TYPES_TETE.find((type) => type.value === value)?.label ?? value;
}

function diametreVis(...values: string[]) {
  const match = values.map((value) => value.match(/\bM\s*(\d+(?:[.,]\d+)?)/i)).find(Boolean)
    ?? values.map((value) => value.match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:x|×)/i)).find(Boolean);
  if (!match) return "";

  const diametre = Number(match[1].replace(",", "."));
  return Number.isFinite(diametre) ? `M${diametre}` : "";
}

function longueurVis(...values: string[]) {
  const match = values.map((value) => value.match(/(?:M\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(?:x|×)\s*(\d+(?:[.,]\d+)?)/i)).find(Boolean);
  if (!match) return "";

  const longueur = Number(match[1].replace(",", "."));
  return Number.isFinite(longueur) ? String(longueur) : "";
}

function getStockPieces(item: Vis) {
  // Les vis sont suivies uniquement en boîtes complètes : un éventuel reliquat
  // historique n'est plus inclus dans le stock actif ni dans une commande.
  return item.boitesPleines * item.piecesParBoite;
}

function getStockBoites(item: Vis) {
  return item.boitesPleines;
}

function getPourcentage(item: Vis) {
  const stock = getStockBoites(item);

  if (item.seuilBoites <= 0) return stock > 0 ? 100 : 0;

  return Math.min(100, Math.round((stock / item.seuilBoites) * 100));
}

function getStatut(item: Vis) {
  const stock = getStockBoites(item);
  const minimum = item.seuilBoites;

  if (stock === 0) return "rupture";
  if (stock < minimum) return "recommander";

  return "ok";
}

function messageErreur(error: unknown) {
  return error instanceof Error ? error.message : "erreur inconnue";
}

export default function StockVis() {
  const [vis, setVis] = useState<Vis[]>([]);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [typeTeteFiltre, setTypeTeteFiltre] = useState("tous");
  const [diametreFiltre, setDiametreFiltre] = useState("tous");
  const [longueurFiltre, setLongueurFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");
  const [tri, setTri] = useState<"recent" | "reference">("recent");

  const [modal, setModal] = useState<
    "sortie" | "ajustement" | "ajouter" | "modifier" | "supprimer" | null
  >(null);

  const [visSelectionnee, setVisSelectionnee] = useState<Vis | null>(null);

  const [quantite, setQuantite] = useState("");

  const [nouvelleReference, setNouvelleReference] = useState("");
  const [nouvelleMatiere, setNouvelleMatiere] = useState("");
  const [nouveauTypeTete, setNouveauTypeTete] = useState("");
  const [nouvelleDimension, setNouvelleDimension] = useState("");
  const [nouvellesPiecesParBoite, setNouvellesPiecesParBoite] =
    useState("200");
  const [nouveauSeuil, setNouveauSeuil] = useState("2");

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  // ============================================================
  // CHARGEMENT SUPABASE
  // ============================================================

  useEffect(() => {
    chargerVis();
  }, []);

  async function chargerVis() {
    setChargement(true);
    setErreur("");

    const { data, error } = await supabase
      .schema("public")
      .from("stock_vis")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("ERREUR SUPABASE STOCK VIS");
      console.error(error);

      setErreur(
        error.message ||
          error.details ||
          error.hint ||
          `Erreur Supabase (${error.code || "inconnue"})`
      );

      setChargement(false);
      return;
    }

    const visConverties: Vis[] = (data ?? []).map((item) => ({
      id: item.id,
      reference: item.reference,
      designation: item.designation ?? "",
      matiere: item.matiere ?? "—",
      typeTete: item.type_tete ?? "",
      dimension: item.dimension ?? "—",
      piecesParBoite: Number(item.pieces_par_boite ?? 0),
      boitesPleines: Number(item.boites_pleines ?? 0),
      piecesRestantes: Number(item.pieces_restantes ?? 0),
      seuilBoites: Number(item.seuil_boites ?? 0),
    }));

    setVis(visConverties);
    notifyStockAlertsUpdated();
    setChargement(false);
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  function fermerModal() {
    setModal(null);
    setVisSelectionnee(null);
    setQuantite("");
    setNouvelleReference("");
    setNouvelleMatiere("");
    setNouveauTypeTete("");
    setNouvelleDimension("");
    setNouvellesPiecesParBoite("200");
    setNouveauSeuil("2");
  }

  // ============================================================
  // FILTRES
  // ============================================================

  const matieres = useMemo(() => {
    return Array.from(new Set(vis.map((item) => item.matiere)));
  }, [vis]);

  const diametres = useMemo(() => {
    return Array.from(new Set(vis.map((item) => diametreVis(item.dimension, item.reference)).filter(Boolean)))
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  }, [vis]);

  const longueurs = useMemo(() => {
    return Array.from(new Set(vis.map((item) => longueurVis(item.dimension, item.reference)).filter(Boolean)))
      .sort((a, b) => Number(a) - Number(b));
  }, [vis]);

  const visFiltres = useMemo(() => {
    return vis.filter((item) => {
      const texte = recherche.toLowerCase();

      const rechercheOK =
        !texte ||
        item.reference.toLowerCase().includes(texte) ||
        item.dimension.toLowerCase().includes(texte) ||
        item.matiere.toLowerCase().includes(texte) ||
        item.typeTete.toLowerCase().includes(texte);

      const matiereOK =
        matiereFiltre === "toutes" ||
        item.matiere === matiereFiltre;

      const typeTeteOK =
        typeTeteFiltre === "tous" ||
        item.typeTete === typeTeteFiltre;

      const diametreOK =
        diametreFiltre === "tous" ||
        diametreVis(item.dimension, item.reference) === diametreFiltre;

      const longueurOK =
        longueurFiltre === "toutes" ||
        longueurVis(item.dimension, item.reference) === longueurFiltre;

      const statutOK =
        statutFiltre === "tous" ||
        getStatut(item) === statutFiltre;

      return rechercheOK && matiereOK && typeTeteOK && diametreOK && longueurOK && statutOK;
    });
  }, [vis, recherche, matiereFiltre, typeTeteFiltre, diametreFiltre, longueurFiltre, statutFiltre]);

  const visAffichees = useMemo(() => {
    return [...visFiltres].sort((a, b) => {
      if (tri === "reference") return a.reference.localeCompare(b.reference, "fr");
      return b.id - a.id;
    });
  }, [visFiltres, tri]);

  const nombreOK = vis.filter(
    (item) => getStatut(item) === "ok"
  ).length;

  const nombreRecommander = vis.filter(
    (item) => getStatut(item) === "recommander"
  ).length;

  const nombreRupture = vis.filter(
    (item) => getStatut(item) === "rupture"
  ).length;

  // ============================================================
  // OUVERTURE DES MODALES
  // ============================================================

  function ouvrirSortie(item: Vis) {
    setVisSelectionnee(item);
    setQuantite("");
    setModal("sortie");
  }

  function ouvrirAjustement(item: Vis) {
    setVisSelectionnee(item);
    setQuantite(String(getStockBoites(item)));
    setModal("ajustement");
  }

  function ouvrirModification(item: Vis) {
    setVisSelectionnee(item);
    setNouvelleReference(item.reference);
    setNouvelleMatiere(item.matiere === "—" ? "" : item.matiere);
    setNouveauTypeTete(item.typeTete);
    setNouvelleDimension(item.dimension === "—" ? "" : item.dimension);
    setNouvellesPiecesParBoite(String(item.piecesParBoite));
    setNouveauSeuil(String(item.seuilBoites));
    setModal("modifier");
  }

  function ouvrirSuppression(item: Vis) {
    setVisSelectionnee(item);
    setModal("supprimer");
  }

  // ============================================================
  // SORTIE
  // ============================================================

  async function sortirStock() {
    if (!visSelectionnee) return;

    const qte = Number(quantite);
    const stock = getStockBoites(visSelectionnee);

    if (!Number.isInteger(qte) || qte <= 0) {
      alert("Indique un nombre entier de boîtes supérieur à 0.");
      return;
    }

    if (qte > stock) {
      alert(
        `Stock insuffisant : ${stock.toLocaleString(
          "fr-FR"
        )} boîte(s) disponible(s).`
      );
      return;
    }

    const boitesPleines = stock - qte;

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_vis")
        .update({
          boites_pleines: boitesPleines,
          pieces_restantes: 0,
        })
        .eq("id", visSelectionnee.id);

      if (error) {
        console.error("Erreur sortie vis :", error);
        alert(
          "Impossible d'enregistrer la sortie : " +
            error.message
        );
        return;
      }

      await chargerVis();
      fermerModal();
    } catch (error: unknown) {
      console.error("Erreur sortie :", error);

      alert(
        "Une erreur est survenue : " +
          messageErreur(error)
      );
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // AJUSTEMENT
  // ============================================================

  async function ajusterStock() {
    if (!visSelectionnee) return;

    const nouveauStock = Number(quantite);

    if (!Number.isInteger(nouveauStock) || nouveauStock < 0) {
      alert("Indique un nombre entier de boîtes valide.");
      return;
    }

    const boitesPleines = nouveauStock;

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_vis")
        .update({
          boites_pleines: boitesPleines,
          pieces_restantes: 0,
        })
        .eq("id", visSelectionnee.id);

      if (error) {
        console.error("Erreur ajustement vis :", error);
        alert(
          "Impossible d'enregistrer l'ajustement : " +
            error.message
        );
        return;
      }

      await chargerVis();
      fermerModal();
    } catch (error: unknown) {
      console.error("Erreur ajustement :", error);

      alert(
        "Une erreur est survenue : " +
          messageErreur(error)
      );
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // CREATION D'UNE REFERENCE
  // ============================================================

  async function creerReference() {
    if (!nouvelleReference.trim()) {
      alert("La référence est obligatoire.");
      return;
    }

    if (!nouvelleMatiere) {
      alert("Sélectionnez la matière de la vis.");
      return;
    }

    if (!nouveauTypeTete) {
      alert("Sélectionnez le type de tête de la vis.");
      return;
    }

    const piecesParBoite = Number(
      nouvellesPiecesParBoite
    );

    const seuil = Number(nouveauSeuil);

    if (!Number.isInteger(piecesParBoite) || piecesParBoite <= 0) {
      alert(
        "Le nombre de pièces par boîte doit être supérieur à 0."
      );
      return;
    }

    if (!Number.isInteger(seuil) || seuil < 0) {
      alert("Le stock minimum doit être un nombre entier de boîtes positif ou nul.");
      return;
    }

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_vis")
        .insert({
          reference: nouvelleReference.trim(),

          // On conserve la colonne en base si elle existe,
          // mais elle n'est plus affichée dans l'interface.
          designation: nouvelleReference.trim(),

          matiere: nouvelleMatiere.trim() || null,
          type_tete: nouveauTypeTete || null,
          dimension: nouvelleDimension.trim() || null,

          pieces_par_boite: piecesParBoite,
          boites_pleines: 0,
          pieces_restantes: 0,
          seuil_boites: seuil,
        });

      if (error) {
        console.error(
          "Erreur création référence vis :",
          error
        );

        alert(
          "Erreur lors de la création : " +
            error.message
        );

        return;
      }

      await chargerVis();

      setNouvelleReference("");
      setNouvelleMatiere("");
      setNouveauTypeTete("");
      setNouvelleDimension("");
      setNouvellesPiecesParBoite("200");
      setNouveauSeuil("2");

      fermerModal();
    } catch (error: unknown) {
      console.error("Erreur création référence :", error);

      alert(
        "Une erreur est survenue : " +
          messageErreur(error)
      );
    } finally {
      setChargement(false);
    }
  }

  async function modifierReference() {
    if (!visSelectionnee) return;

    if (!nouvelleReference.trim() || !nouvelleMatiere || !nouveauTypeTete) {
      alert("La référence, la matière et le type de tête sont obligatoires.");
      return;
    }

    const piecesParBoite = Number(nouvellesPiecesParBoite);
    const seuil = Number(nouveauSeuil);
    if (!Number.isInteger(piecesParBoite) || piecesParBoite <= 0 || !Number.isInteger(seuil) || seuil < 0) {
      alert("Vérifiez le conditionnement et le stock minimum en boîtes entières.");
      return;
    }

    setChargement(true);
    setErreur("");
    try {
      const reference = nouvelleReference.trim();
      const { error } = await supabase
        .from("stock_vis")
        .update({
          reference,
          designation: !visSelectionnee.designation || visSelectionnee.designation === visSelectionnee.reference ? reference : visSelectionnee.designation,
          matiere: nouvelleMatiere,
          type_tete: nouveauTypeTete,
          dimension: nouvelleDimension.trim() || null,
          pieces_par_boite: piecesParBoite,
          seuil_boites: seuil,
        })
        .eq("id", visSelectionnee.id);

      if (error) {
        alert("Impossible d'enregistrer la référence : " + error.message);
        return;
      }

      await chargerVis();
      fermerModal();
    } catch (error: unknown) {
      alert("Une erreur est survenue : " + messageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // SUPPRESSION
  // ============================================================

  async function supprimerReference() {
    if (!visSelectionnee) return;

    const confirmation = window.confirm(
      `Supprimer définitivement la référence ${visSelectionnee.reference} ?`
    );

    if (!confirmation) return;

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_vis")
        .delete()
        .eq("id", visSelectionnee.id);

      if (error) {
        console.error(
          "Erreur suppression vis :",
          error
        );

        alert(
          "Impossible de supprimer la référence : " +
            error.message
        );

        return;
      }

      await chargerVis();
      fermerModal();
    } catch (error: unknown) {
      console.error("Erreur suppression :", error);

      alert(
        "Une erreur est survenue : " +
          messageErreur(error)
      );
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // STATUT
  // ============================================================

  function renderStatut(item: Vis) {
    const statut = getStatut(item);

    if (statut === "ok") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={14} />
          STOCK OK
        </span>
      );
    }

    if (statut === "recommander") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          <AlertTriangle size={14} />
          À RECOMMANDER
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle size={14} />
        RUPTURE
      </span>
    );
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="mx-auto max-w-[1500px] py-4 sm:py-5">
      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18.5rem]">
        <div className="flex min-w-0 flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:p-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#17232b]">
            <Image src="/vis-th-v2.png" alt="Visserie" fill sizes="80px" className="object-contain p-2" />
            <div className="absolute inset-0 bg-slate-950/25" />
            <Package className="absolute inset-0 m-auto text-white" size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#F95516]">Stock · Fixations</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#15232d] sm:text-4xl">Vis</h1>
            <p className="mt-1 text-sm text-slate-500">Visserie inox, acier et zinguée. Sélectionnez vos critères pour affiner la recherche.</p>
          </div>
          <button type="button" onClick={() => setModal("ajouter")} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F95516] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#df4d14] focus:outline-none focus:ring-2 focus:ring-orange-300">
            <Plus size={18} /> Ajouter une référence
          </button>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
          <div className="text-lg font-extrabold text-[#15232d]">{vis.length} références</div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <button type="button" onClick={() => setStatutFiltre(statutFiltre === "ok" ? "tous" : "ok")} className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-green-700"><CheckCircle2 size={17} className="text-green-600" /> OK <strong>{nombreOK}</strong></button>
            <button type="button" onClick={() => setStatutFiltre(statutFiltre === "recommander" ? "tous" : "recommander")} className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-orange-700"><AlertTriangle size={17} className="text-[#F95516]" /> À recommander <strong>{nombreRecommander}</strong></button>
            <button type="button" onClick={() => setStatutFiltre(statutFiltre === "rupture" ? "tous" : "rupture")} className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition hover:text-red-700"><XCircle size={17} className="text-red-500" /> Ruptures <strong>{nombreRupture}</strong></button>
          </div>
        </aside>
      </section>

      <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <CircleGauge size={19} className="text-[#F95516]" />
            <div>
              <h2 className="font-bold text-[#15232d]">Recherche rapide par type de vis</h2>
              <p className="text-xs text-slate-500">Cliquez sur un type de tête pour filtrer les références.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-3 py-3 sm:px-4">
          <div className="grid min-w-[630px] grid-cols-4 gap-2 lg:grid-cols-7">
            {TYPES_TETE.map((type) => {
              const active = typeTeteFiltre === type.value;
              return <button key={type.value} type="button" onClick={() => setTypeTeteFiltre(active ? "tous" : type.value)} aria-pressed={active} className={`group min-h-32 rounded-xl border px-2 py-2 text-center transition ${active ? "border-[#F95516] bg-orange-50 shadow-sm" : "border-slate-200 bg-gradient-to-b from-white to-slate-50/70 hover:border-orange-200 hover:bg-orange-50/40"}`}>
                <div className="relative mx-auto flex h-17 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                  <Image src={visuelVis(type.value)} alt="" fill sizes="92px" className="object-contain p-1.5 transition duration-300 group-hover:scale-105" />
                </div>
                <div className="mt-2 text-sm font-extrabold text-[#15232d]">{type.value}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{type.label.split(" — ")[1]}</div>
              </button>;
            })}
            <button type="button" onClick={() => setTypeTeteFiltre(typeTeteFiltre === "autre" ? "tous" : "autre")} aria-pressed={typeTeteFiltre === "autre"} className={`min-h-32 rounded-xl border px-2 py-2 text-center transition ${typeTeteFiltre === "autre" ? "border-[#F95516] bg-orange-50" : "border-slate-200 bg-slate-50/60 hover:border-orange-200"}`}>
              <div className="mx-auto flex h-17 items-center justify-center rounded-lg bg-slate-100"><Box size={30} className="text-slate-400" /></div>
              <div className="mt-2 text-sm font-extrabold text-[#15232d]">Autre</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Autres types</div>
            </button>
          </div>
        </div>

        <div className="grid border-t border-slate-100 lg:grid-cols-3">
          <div className="p-3 sm:p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#15232d]"><Package size={16} className="text-[#F95516]" /> Matière</div>
            <div className="flex flex-wrap gap-2">
              {["toutes", ...matieres].map((matiere) => {
                const active = matiereFiltre === matiere;
                return <button key={matiere} type="button" onClick={() => setMatiereFiltre(matiere)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-[#F95516] bg-orange-50 text-[#dc4e17]" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}>{matiere === "toutes" ? "Tout" : matiere}</button>;
              })}
            </div>
          </div>
          <div className="border-t border-slate-100 p-3 sm:p-4 lg:border-l lg:border-t-0">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#15232d]"><CircleGauge size={16} className="text-[#F95516]" /> Diamètre (Ø)</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setDiametreFiltre("tous")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${diametreFiltre === "tous" ? "border-[#F95516] bg-orange-50 text-[#dc4e17]" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}>Tout</button>
              {diametres.map((diametre) => <button key={diametre} type="button" onClick={() => setDiametreFiltre(diametre)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${diametreFiltre === diametre ? "border-[#F95516] bg-orange-50 text-[#dc4e17]" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}>{diametre}</button>)}
            </div>
          </div>
          <div className="border-t border-slate-100 p-3 sm:p-4 lg:border-l lg:border-t-0">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#15232d]"><Ruler size={16} className="text-[#F95516]" /> Longueur (mm)</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setLongueurFiltre("toutes")} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${longueurFiltre === "toutes" ? "border-[#F95516] bg-orange-50 text-[#dc4e17]" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}>Tout</button>
              {longueurs.map((longueur) => <button key={longueur} type="button" onClick={() => setLongueurFiltre(longueur)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${longueurFiltre === longueur ? "border-[#F95516] bg-orange-50 text-[#dc4e17]" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}>{longueur}</button>)}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 p-3 sm:flex-row sm:items-center sm:p-4">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-[#F95516]">
            <Search size={18} className="shrink-0 text-slate-500" />
            <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher une référence, une dimension..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setRecherche(""); setMatiereFiltre("toutes"); setTypeTeteFiltre("tous"); setDiametreFiltre("tous"); setLongueurFiltre("toutes"); setStatutFiltre("tous"); }} className="rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200">Réinitialiser les filtres</button>
            <select value={tri} onChange={(e) => setTri(e.target.value as "recent" | "reference")} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#F95516]"><option value="recent">Plus récent</option><option value="reference">Par référence</option></select>
          </div>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight text-[#15232d]">Résultats <span className="text-sm font-semibold text-slate-500">({visAffichees.length} référence{visAffichees.length > 1 ? "s" : ""})</span></h2>
        <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#d94a17]">Cartes</span>
      </div>

      {chargement && <div className="py-12 text-center text-sm text-slate-500">Chargement du stock...</div>}
      {erreur && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Erreur de chargement du stock : {erreur}</div>}

      {!chargement && !erreur && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visAffichees.map((item) => {
            const stock = getStockBoites(item);
            const stockPieces = getStockPieces(item);
            const pourcentage = getPourcentage(item);
            const statut = getStatut(item);
            const ecartSeuil = stock - item.seuilBoites;
            const statusColor = statut === "rupture" ? "bg-red-500" : statut === "recommander" ? "bg-[#F95516]" : "bg-green-500";
            return <article key={item.id} className={`overflow-hidden rounded-2xl border bg-white shadow-[0_8px_22px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.09)] ${statut === "rupture" ? "border-red-100" : statut === "recommander" ? "border-orange-100" : "border-slate-200"}`}>
              <div className="flex gap-3 p-3.5">
                <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:size-32"><Image src={visuelVis(item.typeTete)} alt="" fill sizes="128px" className="object-contain p-2" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><h3 className="min-w-0 truncate text-base font-extrabold text-[#15232d]">{item.reference}</h3>{renderStatut(item)}</div>
                  <div className="mt-2 space-y-1.5 text-xs text-slate-500">
                    <p className="flex items-center gap-2"><Package size={14} className="text-slate-400" /><strong className="text-slate-700">{item.matiere}</strong></p>
                    {item.typeTete && <p className="flex items-center gap-2"><Box size={14} className="text-slate-400" /><span>{typeTeteLabel(item.typeTete)}</span></p>}
                    <p className="flex items-center gap-2"><Ruler size={14} className="text-slate-400" /><span>{item.dimension}</span></p>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 px-3.5 py-3">
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500"><div><span className="block">Conditionnement</span><strong className="text-sm text-slate-700">{item.piecesParBoite.toLocaleString("fr-FR")} pièces / boîte</strong><span className="mt-1 block">Seuil min. : {item.seuilBoites} boîte{item.seuilBoites > 1 ? "s" : ""}</span></div><div className="text-right"><span className="block">Stock</span><strong className={`text-sm ${statut === "rupture" ? "text-red-600" : statut === "recommander" ? "text-[#e04d13]" : "text-green-700"}`}>{stock} boîte{stock > 1 ? "s" : ""}</strong><span className="mt-1 block">Écart : {ecartSeuil >= 0 ? "+" : ""}{ecartSeuil} boîte{Math.abs(ecartSeuil) > 1 ? "s" : ""}</span></div></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`Couverture du seuil minimum : ${pourcentage} %`}><div className={`h-full rounded-full ${statusColor}`} style={{ width: `${pourcentage}%` }} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
                <StockOrderButton compact iconOnly target={{ source: "vis", referenceId: item.id, referenceKey: item.reference, article: item.designation || item.reference, famille: "Vis", stockActuel: stockPieces, seuil: item.seuilBoites * item.piecesParBoite || null, uniteStock: "pieces", piecesParBoite: item.piecesParBoite }} />
                <button type="button" onClick={() => ouvrirModification(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:border-orange-200 hover:text-[#d94a17]"><Pencil size={15} /> Modifier</button>
                <button type="button" onClick={() => ouvrirSortie(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:border-red-200 hover:text-red-700"><Minus size={15} /> Sortie</button>
                <button type="button" onClick={() => ouvrirAjustement(item)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100" title="Ajuster le stock"><Settings size={16} /></button>
                <button type="button" onClick={() => ouvrirSuppression(item)} className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50" title="Supprimer"><Trash2 size={16} /></button>
              </div>
            </article>;
          })}
          {visAffichees.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">Aucune référence ne correspond à ces filtres.</div>}
        </div>
      )}

      {/* MODALES */}

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#2F3437]">

                  {modal === "ajouter" &&
                    "Ajouter une référence"}

                  {modal === "modifier" &&
                    "Modifier la référence"}

                  {modal === "sortie" &&
                    "Sortie de stock"}

                  {modal === "ajustement" &&
                    "Ajuster le stock"}

                  {modal === "supprimer" &&
                    "Supprimer la référence"}

                </h2>

                {visSelectionnee && (
                  <p className="mt-1 text-sm text-slate-500">
                    {visSelectionnee.reference}
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>

            </div>

            {/* AJOUT */}

            {(modal === "ajouter" || modal === "modifier") && (
              <div className="space-y-4 px-6 py-6">

                <input
                  value={nouvelleReference}
                  onChange={(e) =>
                    setNouvelleReference(
                      e.target.value
                    )
                  }
                  placeholder="Référence — ex. VIS-M8X30"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    value={nouvelleMatiere}
                    onChange={(e) => setNouvelleMatiere(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516]"
                  >
                    <option value="">Matière</option>
                    {MATIERES_VIS.map((matiere) => <option key={matiere} value={matiere}>{matiere}</option>)}
                  </select>

                  <select
                    value={nouveauTypeTete}
                    onChange={(e) => setNouveauTypeTete(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516]"
                  >
                    <option value="">Type de tête</option>
                    {TYPES_TETE.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>

                <input
                  value={nouvelleDimension}
                  onChange={(e) => setNouvelleDimension(e.target.value)}
                  placeholder="Dimension — ex. M8 × 30"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Pièces / boîte
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={nouvellesPiecesParBoite}
                      onChange={(e) =>
                        setNouvellesPiecesParBoite(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                    />

                  </div>

                  <div>

                    <label className="mb-1 block text-xs font-semibold text-slate-500">
                      Stock minimum (boîtes)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={nouveauSeuil}
                      onChange={(e) =>
                        setNouveauSeuil(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                    />

                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    onClick={fermerModal}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={modal === "ajouter" ? creerReference : modifierReference}
                    className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white"
                  >
                    {modal === "ajouter" ? "Créer" : "Enregistrer"}
                  </button>

                </div>

              </div>
            )}

            {/* SORTIE / AJUSTEMENT */}

            {(modal === "sortie" ||
              modal === "ajustement") &&
              visSelectionnee && (
                <div className="space-y-5 px-6 py-6">

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="text-sm text-slate-500">
                      Stock actuel
                    </div>

                    <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                      {getStockBoites(visSelectionnee).toLocaleString("fr-FR")}{" "}
                      boîte{getStockBoites(visSelectionnee) > 1 ? "s" : ""}
                    </div>

                  </div>

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {modal === "ajustement"
                        ? "Nouveau stock réel (boîtes)"
                        : "Nombre de boîtes à sortir"}
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={quantite}
                      onChange={(e) =>
                        setQuantite(
                          e.target.value
                        )
                      }
                      autoFocus
                      placeholder="Ex. 2"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#F95516]"
                    />

                  </div>

                  <div className="flex justify-end gap-3">

                    <button
                      onClick={fermerModal}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                    >
                      Annuler
                    </button>

                    <button
                      onClick={
                        modal === "sortie"
                          ? sortirStock
                          : ajusterStock
                      }
                      className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Enregistrer
                    </button>

                  </div>

                </div>
              )}

            {/* SUPPRESSION */}

            {modal === "supprimer" &&
              visSelectionnee && (
                <div className="space-y-5 px-6 py-6">

                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

                    <div className="flex items-start gap-3">

                      <Trash2
                        size={22}
                        className="mt-0.5 text-red-600"
                      />

                      <div>

                        <p className="font-semibold text-red-800">
                          Supprimer cette référence ?
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                          La référence{" "}
                          <strong>
                            {visSelectionnee.reference}
                          </strong>{" "}
                          sera définitivement supprimée
                          du stock.
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="flex justify-end gap-3">

                    <button
                      onClick={fermerModal}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                    >
                      Annuler
                    </button>

                    <button
                      onClick={supprimerReference}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      <Trash2 size={17} />
                      Supprimer
                    </button>

                  </div>

                </div>
              )}

          </div>

        </div>
      )}

    </div>
  );
}
