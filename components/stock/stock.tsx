"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Package,
  Plus,
  Ruler,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StockTube = {
  id: number;
  numero: string;
  parent_id: number | null;
  type: string;
  matiere: string;
  nuance: string | null;
  section: string;
  epaisseur: number | null;
  longueur_commandee: number;
  longueur_disponible: number;
  statut: "disponible" | "utilise";
};

type StockProps = {
  matiere?: "acier" | "inox" | "aluminium";
};

type FormData = {
  type: string;
  matiere: string;
  nuance: string;
  section: string;
  epaisseur: string;
  longueur_commandee: string;
};

const formInitial: FormData = {
  type: "",
  matiere: "",
  nuance: "",
  section: "",
  epaisseur: "",
  longueur_commandee: "6000",
};

const dimensionsStandard: Record<string, string[]> = {
  carre: [
    "20x20", "25x25", "30x30", "35x35", "40x40", "45x45", "50x50",
    "60x60", "70x70", "80x80", "90x90", "100x100", "120x120", "150x150",
  ],
  rectangulaire: [
    "20x40", "25x40", "25x50", "30x50", "30x60", "40x60", "40x80",
    "40x100", "40x120", "50x70", "50x100", "50x120", "50x140", "60x80",
    "60x100", "60x120", "80x120", "80x160", "100x150", "100x200",
  ],
  rond: [
    "17.2", "21.3", "26.9", "33.7", "42.4", "48.3", "60.3", "70",
    "76.1", "88.9", "101.6", "114.3", "139.7", "165.1",
  ],
};

const epaisseursStandard = ["1.5", "2", "2.5", "3", "4", "5", "6"];
const matieresStandard = ["acier", "inox", "aluminium"];

const nuancesStandard: Record<string, string[]> = {
  acier: ["S235"],
  inox: ["Brut 304L", "Brut 316L", "Brossé 304L", "Brossé 316L"],
  aluminium: ["Brut"],
};

function normaliserNombre(value: string) {
  return value.replace(",", ".").trim();
}

function nomMatiere(value: string) {
  if (value === "acier") return "Acier";
  if (value === "inox") return "Inox";
  if (value === "aluminium") return "Aluminium";
  return value;
}

function nomType(value: string) {
  if (value === "carre") return "Carré";
  if (value === "rectangulaire") return "Rectangulaire";
  if (value === "rond") return "Rond";
  return value;
}

function construireSection(type: string, largeur: string, hauteur: string, diametre: string) {
  if (type === "rond") return normaliserNombre(diametre);
  const l = normaliserNombre(largeur);
  const h = normaliserNombre(hauteur);
  return l && h ? `${l}x${h}` : "";
}

function FragmentRow({
  groupe,
  exemple,
  ouvert,
  plein,
  restes,
  onToggle,
  onUse,
  onDelete,
}: {
  groupe: { key: string; items: StockTube[]; longueurTotale: number };
  exemple: StockTube;
  ouvert: boolean;
  plein: StockTube[];
  restes: StockTube[];
  onToggle: () => void;
  onUse: (tube: StockTube) => void;
  onDelete: (tube: StockTube) => void;
}) {
  return (
    <>
      <tr className="border-b bg-white transition hover:bg-slate-50">
        <td className="px-4 py-4">
          <button type="button" onClick={onToggle} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#F95516]" title={ouvert ? "Réduire" : "Voir les morceaux"}>
            {ouvert ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
          </button>
        </td>
        <td className="px-4 py-4 font-semibold text-[#2F3437]">{nomMatiere(exemple.matiere)}</td>
        <td className="px-4 py-4">{nomType(exemple.type)}</td>
        <td className="px-4 py-4 font-semibold">{exemple.type === "rond" ? `Ø ${exemple.section}` : exemple.section}</td>
        <td className="px-4 py-4">{exemple.epaisseur != null ? `${exemple.epaisseur} mm` : "—"}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">{groupe.items.filter((t) => t.statut === "disponible").length} morceau(x)</span>
            <span className="font-bold text-[#2F3437]">{groupe.longueurTotale} mm</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-slate-500">{exemple.nuance || "—"}</td>
        <td className="px-4 py-4">
          <span className="text-xs font-medium text-slate-400">{ouvert ? "Masquer" : "Détails"}</span>
        </td>
      </tr>

      {ouvert && (
        <tr className="border-b bg-slate-50/70">
          <td colSpan={8} className="px-10 py-3">
            <div className="rounded-2xl border border-slate-200 bg-white">
              {groupe.items.map((tube, index) => {
                const estPlein = tube.statut === "disponible" && tube.parent_id == null;
                return (
                  <div key={tube.id} className={`flex items-center justify-between gap-4 px-4 py-3 ${index !== groupe.items.length - 1 ? "border-b border-slate-100" : ""}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`h-2.5 w-2.5 flex-none rounded-full ${tube.statut === "utilise" ? "bg-slate-300" : estPlein ? "bg-green-500" : "bg-[#F95516]"}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#2F3437]">{tube.numero}</span>
                          {tube.statut === "disponible" && (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${estPlein ? "bg-green-50 text-green-700" : "bg-orange-50 text-[#F95516]"}`}>
                              {estPlein ? "Tube plein" : "Reste"}
                            </span>
                          )}
                          {tube.statut === "utilise" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Utilisé</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-5">
                      <span className="min-w-[100px] text-right font-semibold text-[#2F3437]">{tube.longueur_disponible} mm</span>
                      {tube.statut === "disponible" ? (
                        <div className="flex items-center gap-1">
                          <button type="button" title="Utiliser le tube" onClick={() => onUse(tube)} className="rounded-xl p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#F95516]"><Ruler size={18} /></button>
                          <button type="button" title="Retirer du stock" onClick={() => onDelete(tube)} className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={18} /></button>
                        </div>
                      ) : <span className="w-[76px]" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {plein.length > 0 || restes.length > 0 ? (
              <p className="mt-2 px-1 text-xs text-slate-400">Vert = tube plein · Orange = reste</p>
            ) : null}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Stock({ matiere }: StockProps) {
  const [tubes, setTubes] = useState<StockTube[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [modalOuverte, setModalOuverte] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState<FormData>({ ...formInitial, matiere: matiere ?? "" });
  const [dimensionPersonnalisee, setDimensionPersonnalisee] = useState(false);
  const [dimensionLargeur, setDimensionLargeur] = useState("");
  const [dimensionHauteur, setDimensionHauteur] = useState("");
  const [dimensionDiametre, setDimensionDiametre] = useState("");
  const [epaisseurPersonnalisee, setEpaisseurPersonnalisee] = useState(false);
  const [nuancePersonnalisee, setNuancePersonnalisee] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtreSection, setFiltreSection] = useState("");
  const [filtreNuance, setFiltreNuance] = useState("");
  const [groupesOuverts, setGroupesOuverts] = useState<Record<string, boolean>>({});


  const [tubeUtilisation, setTubeUtilisation] = useState<StockTube | null>(null);
  const [modalUtilisationOuverte, setModalUtilisationOuverte] = useState(false);
  const [longueurRestanteSaisie, setLongueurRestanteSaisie] = useState("");
  const [erreurUtilisation, setErreurUtilisation] = useState("");
  const [enregistrementUtilisation, setEnregistrementUtilisation] = useState(false);


  const nuancesDisponibles = useMemo(() => {
    return Array.from(
      new Set([
        ...(nuancesStandard[form.matiere] ?? []),
        ...tubes
          .filter((tube) => tube.matiere === form.matiere && tube.nuance)
          .map((tube) => tube.nuance!.trim()),
      ])
    ).sort((a, b) => a.localeCompare(b, "fr"));
  }, [form.matiere, tubes]);

  const dimensions = dimensionsStandard[form.type] ?? [];

  async function chargerStock() {
    setChargement(true);
    const { data, error } = await supabase
      .from("stock_tubes")
      .select("*")
      .order("id", { ascending: false });
    if (error) setErreur(error.message);
    else setTubes(data ?? []);
    setChargement(false);
  }

  useEffect(() => {
    chargerStock();
  }, []);

  function modifierChamp(champ: keyof FormData, valeur: string) {
    setForm((ancien) => ({ ...ancien, [champ]: valeur }));
  }

  function ouvrirReception() {
    setForm({ ...formInitial, matiere: matiere ?? "" });
    setDimensionPersonnalisee(false);
    setDimensionLargeur("");
    setDimensionHauteur("");
    setDimensionDiametre("");
    setEpaisseurPersonnalisee(false);
    setNuancePersonnalisee(false);
    setErreur("");
    setMessage("");
    setModalOuverte(true);
  }

  function fermerReception() {
    if (enregistrement) return;
    setModalOuverte(false);
    setErreur("");
  }

  async function genererNumeroTube() {
    const { data, error } = await supabase.from("stock_tubes").select("numero").like("numero", "T-%");
    if (error) throw new Error(`Impossible de générer le numéro du tube : ${error.message}`);
    let dernier = 0;
    for (const tube of data ?? []) {
      const match = tube.numero?.match(/^T-(\d+)$/);
      if (match) dernier = Math.max(dernier, Number(match[1]));
    }
    return `T-${String(dernier + 1).padStart(4, "0")}`;
  }

  async function enregistrerTube() {
    setErreur("");
    setMessage("");
    if (!form.type) return setErreur("Veuillez sélectionner le type de tube.");
    if (!form.matiere) return setErreur("Veuillez sélectionner la matière.");
    if (!form.section.trim()) return setErreur("Veuillez sélectionner ou renseigner une section.");
    const longueur = Number(normaliserNombre(form.longueur_commandee));
    if (!Number.isFinite(longueur) || longueur <= 0) return setErreur("La longueur commandée doit être supérieure à 0.");

    let epaisseur: number | null = null;
    if (form.epaisseur.trim()) {
      epaisseur = Number(normaliserNombre(form.epaisseur));
      if (!Number.isFinite(epaisseur) || epaisseur <= 0) return setErreur("L'épaisseur renseignée n'est pas valide.");
    }

    const sectionNormalisee = form.section.trim().replace(/\s+/g, "").replace(/X/g, "x");
    if (dimensionPersonnalisee && (dimensionsStandard[form.type] ?? []).includes(sectionNormalisee)) {
      return setErreur(`Cette dimension existe déjà dans les standards : ${sectionNormalisee}.`);
    }

    setEnregistrement(true);
    try {
      const numero = await genererNumeroTube();
      const { data, error } = await supabase.from("stock_tubes").insert({
        numero,
        parent_id: null,
        type: form.type,
        matiere: form.matiere,
        nuance: form.nuance.trim() || null,
        section: sectionNormalisee,
        epaisseur,
        longueur_commandee: longueur,
        longueur_disponible: longueur,
        statut: "disponible",
      }).select().single();
      if (error) throw new Error(error.message);

      const { error: mouvementError } = await supabase.from("stock_mouvements").insert({
        tube_id: data.id,
        type_mouvement: "reception",
        longueur,
        tube_source_id: null,
        tube_resultat_id: data.id,
        commentaire: `Réception du tube ${numero}`,
      });
      if (mouvementError) console.error("Historique réception :", mouvementError);

      await chargerStock();
      setMessage(`Tube ${numero} enregistré avec succès.`);
      setTimeout(() => {
        setModalOuverte(false);
        setMessage("");
      }, 700);
    } catch (error: any) {
      setErreur(error?.message || "Une erreur est survenue.");
    } finally {
      setEnregistrement(false);
    }
  }

  function ouvrirUtilisation(tube: StockTube) {
    setTubeUtilisation(tube);
    setLongueurRestanteSaisie(String(tube.longueur_disponible));
    setErreurUtilisation("");
    setModalUtilisationOuverte(true);
  }

  function fermerUtilisation() {
    if (enregistrementUtilisation) return;
    setModalUtilisationOuverte(false);
    setTubeUtilisation(null);
    setLongueurRestanteSaisie("");
    setErreurUtilisation("");
  }

  const longueurRestante = longueurRestanteSaisie !== ""
    ? Number(normaliserNombre(longueurRestanteSaisie))
    : tubeUtilisation?.longueur_disponible ?? 0;

  const longueurUtilisee = tubeUtilisation
    ? tubeUtilisation.longueur_disponible - longueurRestante
    : 0;

  async function genererNumeroRemnant(tubeSource: StockTube) {
    const racine = tubeSource.numero.split("-R")[0];
    const { data, error } = await supabase.from("stock_tubes").select("numero").like("numero", `${racine}-R%`);
    if (error) throw new Error(`Impossible de générer le numéro du reste : ${error.message}`);
    let dernier = 0;
    for (const tube of data ?? []) {
      const match = tube.numero?.match(new RegExp(`^${racine.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}-R(\\d+)$`));
      if (match) dernier = Math.max(dernier, Number(match[1]));
    }
    return `${racine}-R${String(dernier + 1).padStart(2, "0")}`;
  }

  async function enregistrerUtilisation() {
    setErreurUtilisation("");
    if (!tubeUtilisation) return;
    if (longueurRestanteSaisie === "") return setErreurUtilisation("Veuillez renseigner la nouvelle longueur restante.");

    const nouvelleLongueur = Number(normaliserNombre(longueurRestanteSaisie));
    if (!Number.isFinite(nouvelleLongueur) || nouvelleLongueur < 0) {
      return setErreurUtilisation("La longueur restante doit être supérieure ou égale à 0 mm.");
    }
    if (nouvelleLongueur > tubeUtilisation.longueur_disponible) {
      return setErreurUtilisation(`La nouvelle longueur restante (${nouvelleLongueur} mm) ne peut pas dépasser la longueur actuelle (${tubeUtilisation.longueur_disponible} mm).`);
    }

    const utilisee = tubeUtilisation.longueur_disponible - nouvelleLongueur;
    if (utilisee <= 0) return setErreurUtilisation("La nouvelle longueur restante doit être inférieure à la longueur actuelle.");

    setEnregistrementUtilisation(true);
    try {
      const { error: sourceError } = await supabase.from("stock_tubes").update({ longueur_disponible: 0, statut: "utilise" }).eq("id", tubeUtilisation.id);
      if (sourceError) throw new Error(`Impossible de mettre à jour le tube source : ${sourceError.message}`);

      let resultat: StockTube | null = null;
      if (nouvelleLongueur > 0) {
        const numeroReste = await genererNumeroRemnant(tubeUtilisation);
        const { data, error } = await supabase.from("stock_tubes").insert({
          numero: numeroReste,
          parent_id: tubeUtilisation.id,
          type: tubeUtilisation.type,
          matiere: tubeUtilisation.matiere,
          nuance: tubeUtilisation.nuance,
          section: tubeUtilisation.section,
          epaisseur: tubeUtilisation.epaisseur,
          longueur_commandee: nouvelleLongueur,
          longueur_disponible: nouvelleLongueur,
          statut: "disponible",
        }).select().single();
        if (error) throw new Error(`Impossible de créer le reste du tube : ${error.message}`);
        resultat = data;
      }

      const commentaire = nouvelleLongueur > 0
        ? `Utilisation de ${utilisee} mm. Reste ${nouvelleLongueur} mm dans ${resultat?.numero}.`
        : `Utilisation complète de ${utilisee} mm. Aucun reste.`;

      const { error: mouvementError } = await supabase.from("stock_mouvements").insert({
        tube_id: tubeUtilisation.id,
        type_mouvement: "utilisation",
        longueur: utilisee,
        tube_source_id: tubeUtilisation.id,
        tube_resultat_id: resultat?.id ?? null,
        commentaire,
      });
      if (mouvementError) throw new Error(`L’utilisation a été enregistrée mais l’historique n’a pas pu être enregistré : ${mouvementError.message}`);

      await chargerStock();
      fermerUtilisation();
    } catch (error: any) {
      setErreurUtilisation(error?.message || "Une erreur est survenue pendant l’utilisation.");
    } finally {
      setEnregistrementUtilisation(false);
    }
  }

  async function supprimerDuStock(tube: StockTube) {
    const confirme = window.confirm(
      `Supprimer ${tube.numero} du stock ?\n\nCette action retirera définitivement ce morceau du stock.`
    );

    if (!confirme) return;

    setErreur("");
    setMessage("");

    try {
      // On supprime d'abord tous les mouvements liés au tube pour éviter
      // qu'une contrainte de clé étrangère bloque la suppression.
      const { error: mouvementsError } = await supabase
        .from("stock_mouvements")
        .delete()
        .or(
          `tube_id.eq.${tube.id},tube_source_id.eq.${tube.id},tube_resultat_id.eq.${tube.id}`
        );

      if (mouvementsError) {
        throw new Error(
          `Impossible de supprimer l'historique du tube : ${mouvementsError.message}`
        );
      }

      const { error } = await supabase
        .from("stock_tubes")
        .delete()
        .eq("id", tube.id);

      if (error) {
        throw new Error(
          `Impossible de supprimer le tube du stock : ${error.message}`
        );
      }

      setTubes((precedentes) => precedentes.filter((t) => t.id !== tube.id));
      setMessage(`Tube ${tube.numero} retiré du stock.`);
      setTimeout(() => setMessage(""), 2500);
    } catch (error: any) {
      setErreur(
        error?.message ||
          "Une erreur est survenue lors de la suppression du tube."
      );
    }
  }

  const tubesFiltres = tubes.filter((tube) => {
    const terme = recherche.trim().toLowerCase();
    const okRecherche = !terme || [tube.numero, tube.matiere, tube.type, tube.section, tube.nuance ?? ""].some((v) => v.toLowerCase().includes(terme));
    const okMatierePage = !matiere || tube.matiere === matiere;
    return (
      tube.statut === "disponible" &&
      okRecherche &&
      okMatierePage &&
      (!filtreMatiere || tube.matiere === filtreMatiere) &&
      (!filtreType || tube.type === filtreType) &&
      (!filtreSection || tube.section.toLowerCase().includes(filtreSection.toLowerCase())) &&
      (!filtreNuance || (tube.nuance ?? "").toLowerCase().includes(filtreNuance.toLowerCase()))
    );
  });

  const tubesPage = matiere ? tubes.filter((tube) => tube.matiere === matiere) : tubes;
  const filtresActifs = !!(recherche || filtreMatiere || filtreType || filtreSection || filtreNuance);

  function cleGroupe(tube: StockTube) {
    return [
      tube.matiere,
      tube.type,
      tube.section,
      tube.epaisseur ?? "",
      tube.nuance ?? "",
    ].join("|");
  }

  const groupes = useMemo(() => {
    const map = new Map<string, StockTube[]>();

    for (const tube of tubesFiltres) {
      const key = cleGroupe(tube);
      const groupe = map.get(key) ?? [];
      groupe.push(tube);
      map.set(key, groupe);
    }

    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => b.longueur_disponible - a.longueur_disponible),
      longueurTotale: items.reduce((total, tube) => total + (tube.statut === "disponible" ? tube.longueur_disponible : 0), 0),
    }));
  }, [tubesFiltres]);

  function basculerGroupe(key: string) {
    setGroupesOuverts((anciens) => ({
      ...anciens,
      [key]: !anciens[key],
    }));
  }

  function reinitialiserFiltres() {
    setRecherche("");
    setFiltreMatiere("");
    setFiltreType("");
    setFiltreSection("");
    setFiltreNuance("");
    setGroupesOuverts({});
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package size={32} className="text-[#F95516]" />
            <h1 className="text-3xl font-bold text-[#2F3437] sm:text-4xl">
              {matiere ? `Tubes — ${nomMatiere(matiere)}` : "Stock tubes"}
            </h1>
          </div>
          <p className="mt-2 text-slate-500">Gestion des tubes disponibles dans l&apos;atelier</p>
        </div>
        <button type="button" onClick={ouvrirReception} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13] sm:w-auto">
          <Plus size={20} /> Réceptionner un tube
        </button>
      </div>

      {erreur && !modalOuverte && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong>Erreur :</strong> {erreur}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">Tubes en stock</h2>
              <p className="mt-1 text-sm text-slate-500">{tubesFiltres.filter((t) => t.statut === "disponible").length} morceau(x) disponible(s)</p>
            </div>
            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">{tubesFiltres.length} / {tubesPage.length} tube(s)</div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="relative xl:col-span-2"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher N°, matière, section..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100" /></div>
            <select value={filtreMatiere} onChange={(e) => setFiltreMatiere(e.target.value)} disabled={!!matiere} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516] disabled:bg-slate-50"><option value="">Toutes les matières</option><option value="acier">Acier</option><option value="inox">Inox</option><option value="aluminium">Aluminium</option></select>
            <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]"><option value="">Tous les types</option><option value="carre">Carré</option><option value="rectangulaire">Rectangulaire</option><option value="rond">Rond</option></select>
            <input value={filtreSection} onChange={(e) => setFiltreSection(e.target.value)} placeholder="Section" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]" />
            <input value={filtreNuance} onChange={(e) => setFiltreNuance(e.target.value)} placeholder="Nuance" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]" />
          </div>

          {filtresActifs && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reinitialiserFiltres}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {chargement ? (
          <div className="flex items-center justify-center p-16"><Loader2 size={28} className="animate-spin text-[#F95516]" /></div>
        ) : tubesPage.length === 0 ? (
          <div className="p-16 text-center"><Package size={60} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-bold text-[#2F3437]">Aucun tube dans le stock</h2><p className="mt-2 text-slate-500">Les tubes réceptionnés apparaîtront ici.</p></div>
        ) : tubesFiltres.length === 0 ? (
          <div className="p-16 text-center"><Search size={52} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-bold text-[#2F3437]">Aucun tube ne correspond aux filtres</h2><p className="mt-2 text-slate-500">Modifiez votre recherche ou réinitialisez les filtres.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-500">
                  <th className="w-10 px-4 py-4"></th>
                  <th className="px-4 py-4">Matière</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Section</th>
                  <th className="px-4 py-4">Épaisseur</th>
                  <th className="px-4 py-4">Stock</th>
                  <th className="px-4 py-4">Nuance</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupes.map((groupe) => {
                  const ouvert = !!groupesOuverts[groupe.key];
                  const disponibleItems = groupe.items.filter((tube) => tube.statut === "disponible");
                  const plein = disponibleItems.filter((tube) => tube.parent_id == null);
                  const restes = disponibleItems.filter((tube) => tube.parent_id != null);
                  const exemple = groupe.items[0];

                  return (
                    <FragmentRow
                      key={groupe.key}
                      groupe={groupe}
                      exemple={exemple}
                      ouvert={ouvert}
                      plein={plein}
                      restes={restes}
                      onToggle={() => basculerGroupe(groupe.key)}
                      onUse={ouvrirUtilisation}
                      onDelete={supprimerDuStock}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECEPTION */}
      {modalOuverte && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && fermerReception()}><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-8 py-6"><div><h2 className="text-2xl font-bold text-[#2F3437]">Réceptionner un tube</h2><p className="mt-1 text-sm text-slate-500">Ajouter un nouveau tube physique au stock</p></div><button type="button" onClick={fermerReception} disabled={enregistrement} className="rounded-xl p-2 hover:bg-slate-100"><X size={22} /></button></div><div className="space-y-6 p-8">
        <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Type *</label><select value={form.type} onChange={(e) => { modifierChamp("type", e.target.value); modifierChamp("section", ""); setDimensionPersonnalisee(false); setDimensionLargeur(""); setDimensionHauteur(""); setDimensionDiametre(""); }} className="w-full rounded-xl border px-4 py-3"><option value="">Sélectionner</option><option value="carre">Carré</option><option value="rectangulaire">Rectangulaire</option><option value="rond">Rond</option></select></div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Matière *</label>{matiere ? <div className="flex h-[50px] items-center rounded-xl border border-orange-200 bg-orange-50 px-4 font-semibold text-[#F95516]">{nomMatiere(matiere)}</div> : <select value={form.matiere} onChange={(e) => { modifierChamp("matiere", e.target.value); modifierChamp("nuance", ""); setNuancePersonnalisee(false); }} className="w-full rounded-xl border px-4 py-3"><option value="">Sélectionner</option>{matieresStandard.map((m) => <option key={m} value={m}>{nomMatiere(m)}</option>)}</select>}</div></div>
        <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Nuance</label>{!nuancePersonnalisee ? <select value={form.nuance} onChange={(e) => { if (e.target.value === "__personnalisee__") { modifierChamp("nuance", ""); setNuancePersonnalisee(true); } else modifierChamp("nuance", e.target.value); }} disabled={!form.matiere} className="w-full rounded-xl border px-4 py-3"><option value="">Sélectionner</option>{nuancesDisponibles.map((n) => <option key={n} value={n}>{n}</option>)}<option value="__personnalisee__">+ Nuance personnalisée</option></select> : <div className="space-y-2"><input value={form.nuance} onChange={(e) => modifierChamp("nuance", e.target.value)} placeholder="Ex. Satiné 316L" className="w-full rounded-xl border px-4 py-3" /><button type="button" onClick={() => { setNuancePersonnalisee(false); modifierChamp("nuance", ""); }} className="text-sm font-semibold text-[#F95516]">Revenir aux nuances disponibles</button></div>}</div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Section *</label>{!dimensionPersonnalisee ? <select value={form.section} onChange={(e) => { if (e.target.value === "__personnalisee__") { modifierChamp("section", ""); setDimensionPersonnalisee(true); } else modifierChamp("section", e.target.value); }} disabled={!form.type} className="w-full rounded-xl border px-4 py-3"><option value="">{form.type ? "Sélectionner une dimension" : "Sélectionner d'abord le type"}</option>{dimensions.map((d) => <option key={d} value={d}>{form.type === "rond" ? `Ø ${d}` : d}</option>)}{form.type && <option value="__personnalisee__">+ Dimension personnalisée</option>}</select> : <div className="space-y-3">{form.type === "rond" ? <div className="relative"><input type="number" min="0.1" step="0.1" value={dimensionDiametre} onChange={(e) => { setDimensionDiametre(e.target.value); modifierChamp("section", construireSection("rond", "", "", e.target.value)); }} placeholder="Diamètre" className="w-full rounded-xl border px-4 py-3 pr-12" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">mm</span></div> : <div className="grid grid-cols-2 gap-3"><input type="number" min="0.1" step="0.1" value={dimensionLargeur} onChange={(e) => { setDimensionLargeur(e.target.value); modifierChamp("section", construireSection(form.type, e.target.value, dimensionHauteur, "")); }} placeholder="Largeur" className="rounded-xl border px-4 py-3" /><input type="number" min="0.1" step="0.1" value={dimensionHauteur} onChange={(e) => { setDimensionHauteur(e.target.value); modifierChamp("section", construireSection(form.type, dimensionLargeur, e.target.value, "")); }} placeholder="Hauteur" className="rounded-xl border px-4 py-3" /></div>}<div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-500">Section : <strong>{form.section || "—"}</strong></span><button type="button" onClick={() => { setDimensionPersonnalisee(false); setDimensionLargeur(""); setDimensionHauteur(""); setDimensionDiametre(""); modifierChamp("section", ""); }} className="text-sm font-semibold text-[#F95516]">Revenir aux standards</button></div></div>}</div></div>
        <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-semibold text-slate-700">Épaisseur</label>{!epaisseurPersonnalisee ? <select value={form.epaisseur} onChange={(e) => { if (e.target.value === "__personnalisee__") { modifierChamp("epaisseur", ""); setEpaisseurPersonnalisee(true); } else modifierChamp("epaisseur", e.target.value); }} className="w-full rounded-xl border px-4 py-3"><option value="">Sélectionner</option>{epaisseursStandard.map((e) => <option key={e} value={e}>{e} mm</option>)}<option value="__personnalisee__">+ Épaisseur personnalisée</option></select> : <div className="space-y-2"><input type="number" min="0.1" step="0.1" value={form.epaisseur} onChange={(e) => modifierChamp("epaisseur", e.target.value)} placeholder="Ex. 2.7" className="w-full rounded-xl border px-4 py-3" /><button type="button" onClick={() => { setEpaisseurPersonnalisee(false); modifierChamp("epaisseur", ""); }} className="text-sm font-semibold text-[#F95516]">Revenir aux épaisseurs standards</button></div>}</div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Longueur commandée *</label><div className="relative"><input type="number" min="1" step="1" value={form.longueur_commandee} onChange={(e) => modifierChamp("longueur_commandee", e.target.value)} className="w-full rounded-xl border px-4 py-3 pr-12" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">mm</span></div></div></div>
        {erreur && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong>Erreur :</strong> {erreur}</div>}{message && <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}
        <div className="flex justify-end gap-3 border-t pt-6"><button type="button" onClick={fermerReception} disabled={enregistrement} className="rounded-xl border px-5 py-3 font-semibold">Annuler</button><button type="button" onClick={enregistrerTube} disabled={enregistrement} className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white">{enregistrement ? <><Loader2 size={18} className="animate-spin" />Enregistrement...</> : <><Save size={18} />Réceptionner</>}</button></div>
      </div></div></div>}

      {/* UTILISATION */}
      {modalUtilisationOuverte && tubeUtilisation && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && fermerUtilisation()}
        >
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-8 py-6">
              <div>
                <h2 className="text-2xl font-bold text-[#2F3437]">Utiliser le tube</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Saisissez directement la longueur qu&apos;il restera.
                </p>
              </div>
              <button
                type="button"
                onClick={fermerUtilisation}
                disabled={enregistrementUtilisation}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-8">
              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Tube</p>
                    <p className="mt-1 text-lg font-bold text-[#2F3437]">{tubeUtilisation.numero}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Longueur actuelle</p>
                    <p className="mt-1 text-lg font-bold text-[#2F3437]">{tubeUtilisation.longueur_disponible} mm</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Matière</p>
                    <p className="mt-1 font-semibold text-slate-700">{nomMatiere(tubeUtilisation.matiere)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">Section</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {tubeUtilisation.type === "rond" ? `Ø ${tubeUtilisation.section}` : tubeUtilisation.section}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nouvelle longueur restante *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={tubeUtilisation.longueur_disponible}
                    step="1"
                    autoFocus
                    value={longueurRestanteSaisie}
                    onChange={(e) => {
                      setLongueurRestanteSaisie(e.target.value);
                      setErreurUtilisation("");
                    }}
                    className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-16 text-lg outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">mm</span>
                </div>
              </div>

              {erreurUtilisation && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Erreur :</strong> {erreurUtilisation}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={fermerUtilisation}
                  disabled={enregistrementUtilisation}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={enregistrerUtilisation}
                  disabled={enregistrementUtilisation}
                  className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {enregistrementUtilisation ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Ruler size={18} />
                      Valider l’utilisation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
