"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  X,
  Save,
  Loader2,
  Eye,
  Search,
  Trash2,
  Ruler,
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
  statut: "disponible" | "utilise" | "rebut";
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


// =========================================================
// DIMENSIONS STANDARD / PERSONNALISEES
// =========================================================
// Les dimensions proposées servent de référence.
// Une dimension personnalisée reste possible, mais elle est
// construite automatiquement pour éviter les espaces/variantes
// de saisie dans la base.

const dimensionsStandard: Record<string, string[]> = {
  carre: [
    "20x20", "25x25", "30x30", "35x35", "40x40",
    "45x45", "50x50", "60x60", "70x70", "80x80",
    "90x90", "100x100", "120x120", "150x150",
  ],
  rectangulaire: [
    "20x40", "25x40", "25x50", "30x50", "30x60",
    "40x60", "40x80", "40x100", "40x120", "50x70",
    "50x100", "50x120", "50x140", "60x80", "60x100",
    "60x120", "80x120", "80x160", "100x150", "100x200",
  ],
  rond: [
    "17.2", "21.3", "26.9", "33.7", "42.4", "48.3",
    "60.3", "70", "76.1", "88.9", "101.6", "114.3",
    "139.7", "165.1",
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

function construireSection(
  type: string,
  largeur: string,
  hauteur: string,
  diametre: string
) {
  if (type === "rond") {
    const d = normaliserNombre(diametre);
    return d ? d : "";
  }

  const l = normaliserNombre(largeur);
  const h = normaliserNombre(hauteur);

  if (!l || !h) return "";
  return `${l}x${h}`;
}

export default function Stock() {
  const [tubes, setTubes] = useState<StockTube[]>([]);
  const [modalOuverte, setModalOuverte] = useState(false);

  const [form, setForm] = useState<FormData>(formInitial);

  const [dimensionPersonnalisee, setDimensionPersonnalisee] = useState(false);
  const [dimensionLargeur, setDimensionLargeur] = useState("");
  const [dimensionHauteur, setDimensionHauteur] = useState("");
  const [dimensionDiametre, setDimensionDiametre] = useState("");

  const [epaisseurPersonnalisee, setEpaisseurPersonnalisee] = useState(false);
  const [nuancePersonnalisee, setNuancePersonnalisee] = useState(false);

  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  const [recherche, setRecherche] = useState("");
  const [filtreMatiere, setFiltreMatiere] = useState("");
  const [filtreType, setFiltreType] = useState("");
  const [filtreSection, setFiltreSection] = useState("");
  const [filtreNuance, setFiltreNuance] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("disponible");

  const [tubeDetail, setTubeDetail] = useState<StockTube | null>(null);
  const [modalDetailOuverte, setModalDetailOuverte] = useState(false);
  const [historiqueTube, setHistoriqueTube] = useState<any[]>([]);
  const [chargementHistorique, setChargementHistorique] = useState(false);
  const [erreurDetail, setErreurDetail] = useState("");

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // UTILISATION
  // =========================================================

  const [tubeUtilisation, setTubeUtilisation] =
    useState<StockTube | null>(null);

  const [modalUtilisationOuverte, setModalUtilisationOuverte] =
    useState(false);

  const [longueurUtilisee, setLongueurUtilisee] =
    useState("");

  const [erreurUtilisation, setErreurUtilisation] =
    useState("");

  const [enregistrementUtilisation, setEnregistrementUtilisation] =
    useState(false);

  // =========================================================
  // REBUT
  // =========================================================

  const [tubeRebut, setTubeRebut] = useState<StockTube | null>(null);
  const [modalRebutOuverte, setModalRebutOuverte] = useState(false);
  const [motifRebut, setMotifRebut] = useState("");
  const [erreurRebut, setErreurRebut] = useState("");
  const [enregistrementRebut, setEnregistrementRebut] = useState(false);


  const nuancesDisponibles = Array.from(
    new Set([
      ...(nuancesStandard[form.matiere] ?? []),
      ...tubes
        .filter((tube) => tube.matiere === form.matiere && tube.nuance)
        .map((tube) => tube.nuance!.trim()),
    ])
  ).sort((a, b) => a.localeCompare(b, "fr"));

  // =========================================================
  // CHARGEMENT DU STOCK
  // =========================================================

  async function chargerStock() {
    setChargement(true);
    setErreur("");

    const { data, error } = await supabase
      .from("stock_tubes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erreur chargement stock :", error);
      setErreur(error.message);
      setChargement(false);
      return;
    }

    setTubes(data ?? []);
    setChargement(false);
  }

  useEffect(() => {
    chargerStock();
  }, []);

  // =========================================================
  // RECEPTION
  // =========================================================

  function ouvrirReception() {
    setForm(formInitial);
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

  function modifierChamp(
    champ: keyof FormData,
    valeur: string
  ) {
    setForm((ancien) => ({
      ...ancien,
      [champ]: valeur,
    }));
  }

  // =========================================================
  // GENERATION NUMERO TUBE
  // =========================================================

  async function genererNumeroTube() {
    const { data, error } = await supabase
      .from("stock_tubes")
      .select("numero")
      .like("numero", "T-%");

    if (error) {
      throw new Error(
        `Impossible de générer le numéro du tube : ${error.message}`
      );
    }

    let dernierNumero = 0;

    for (const tube of data ?? []) {
      const match = tube.numero?.match(/^T-(\d+)$/);

      if (match) {
        const numero = Number(match[1]);

        if (numero > dernierNumero) {
          dernierNumero = numero;
        }
      }
    }

    return `T-${String(dernierNumero + 1).padStart(4, "0")}`;
  }

  // =========================================================
  // ENREGISTREMENT RECEPTION
  // =========================================================

  async function enregistrerTube() {
    setErreur("");
    setMessage("");

    if (!form.type) {
      setErreur("Veuillez sélectionner le type de tube.");
      return;
    }

    if (!form.matiere) {
      setErreur("Veuillez sélectionner la matière.");
      return;
    }

    if (!form.section.trim()) {
      setErreur("Veuillez sélectionner ou renseigner une section.");
      return;
    }

    if (!form.longueur_commandee) {
      setErreur("Veuillez renseigner la longueur commandée.");
      return;
    }

    const longueur = Number(form.longueur_commandee);

    if (!Number.isFinite(longueur) || longueur <= 0) {
      setErreur("La longueur commandée doit être supérieure à 0.");
      return;
    }

    let epaisseur: number | null = null;

    if (form.epaisseur.trim()) {
      epaisseur = Number(normaliserNombre(form.epaisseur));

      if (!Number.isFinite(epaisseur) || epaisseur <= 0) {
        setErreur("L'épaisseur renseignée n'est pas valide.");
        return;
      }
    }


    const sectionNormalisee = form.section.trim().replace(/\s+/g, "").replace(/X/g, "x");

    const sectionExisteDansStandards =
      (dimensionsStandard[form.type] ?? []).includes(sectionNormalisee);

    if (dimensionPersonnalisee && sectionExisteDansStandards) {
      setErreur(
        `Cette dimension existe déjà dans les standards : ${sectionNormalisee}. Sélectionnez-la dans la liste plutôt que de l'enregistrer comme personnalisée.`
      );
      return;
    }

    setEnregistrement(true);

    try {
      const numero = await genererNumeroTube();

      const { data, error } = await supabase
        .from("stock_tubes")
        .insert({
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
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur création tube :", error);
        setErreur(error.message);
        return;
      }

      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements")
        .insert({
          tube_id: data.id,
          type_mouvement: "reception",
          longueur: longueur,
          tube_source_id: null,
          tube_resultat_id: data.id,
          commentaire: `Réception du tube ${numero}`,
        });

      if (erreurMouvement) {
        console.error(
          "Erreur historique réception :",
          erreurMouvement
        );

        setMessage(
          `Tube ${numero} enregistré, mais l'historique n'a pas pu être créé.`
        );
      } else {
        setMessage(
          `Tube ${numero} enregistré avec succès.`
        );
      }

      setForm(formInitial);

      await chargerStock();

      setTimeout(() => {
        setModalOuverte(false);
        setMessage("");
      }, 800);
    } catch (error: any) {
      console.error(error);

      setErreur(
        error?.message || "Une erreur est survenue."
      );
    } finally {
      setEnregistrement(false);
    }
  }

  // =========================================================
  // OUVRIR MODALE UTILISATION
  // =========================================================

  function ouvrirUtilisation(tube: StockTube) {
    setTubeUtilisation(tube);
    setLongueurUtilisee("");
    setErreurUtilisation("");
    setModalUtilisationOuverte(true);
  }

  function fermerUtilisation() {
    if (enregistrementUtilisation) return;

    setModalUtilisationOuverte(false);
    setTubeUtilisation(null);
    setLongueurUtilisee("");
    setErreurUtilisation("");
  }

  // =========================================================
  // CALCUL LONGUEUR RESTANTE
  // =========================================================

  const longueurRestante =
    tubeUtilisation && longueurUtilisee
      ? tubeUtilisation.longueur_disponible -
        Number(longueurUtilisee)
      : tubeUtilisation?.longueur_disponible ?? 0;

  // =========================================================
  // GENERATION NUMERO REMNANT
  // =========================================================

  async function genererNumeroRemnant(
    tubeSource: StockTube
  ) {
    const numeroRacine = tubeSource.numero.split("-R")[0];

    const { data, error } = await supabase
      .from("stock_tubes")
      .select("numero")
      .like("numero", `${numeroRacine}-R%`);

    if (error) {
      throw new Error(
        `Impossible de générer le numéro du reste : ${error.message}`
      );
    }

    let dernierRang = 0;

    for (const tube of data ?? []) {
      const match = tube.numero?.match(
        new RegExp(
          `^${numeroRacine.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}-R(\\d+)$`
        )
      );

      if (match) {
        const rang = Number(match[1]);

        if (rang > dernierRang) {
          dernierRang = rang;
        }
      }
    }

    return `${numeroRacine}-R${String(
      dernierRang + 1
    ).padStart(2, "0")}`;
  }

  // =========================================================
  // ENREGISTRER UTILISATION
  // =========================================================

  async function enregistrerUtilisation() {
    setErreurUtilisation("");

    if (!tubeUtilisation) {
      return;
    }

    const longueur = Number(longueurUtilisee);

    if (
      !longueurUtilisee ||
      !Number.isFinite(longueur) ||
      longueur <= 0
    ) {
      setErreurUtilisation(
        "Veuillez renseigner une longueur utilisée supérieure à 0 mm."
      );
      return;
    }

    if (longueur > tubeUtilisation.longueur_disponible) {
      setErreurUtilisation(
        `La longueur utilisée (${longueur} mm) dépasse la longueur restante (${tubeUtilisation.longueur_disponible} mm).`
      );
      return;
    }

    setEnregistrementUtilisation(true);

    try {
      const reste =
        tubeUtilisation.longueur_disponible - longueur;

      // =====================================================
      // 1. MARQUER LE TUBE SOURCE COMME UTILISE
      // =====================================================

      const { error: erreurSource } = await supabase
        .from("stock_tubes")
        .update({
          longueur_disponible: 0,
          statut: "utilise",
        })
        .eq("id", tubeUtilisation.id);

      if (erreurSource) {
        throw new Error(
          `Impossible de mettre à jour le tube source : ${erreurSource.message}`
        );
      }

      // =====================================================
      // 2. CREER LE RESTE S'IL Y EN A UN
      // =====================================================

      let tubeResultat: StockTube | null = null;

      if (reste > 0) {
        const numeroReste =
          await genererNumeroRemnant(tubeUtilisation);

        const { data, error } = await supabase
          .from("stock_tubes")
          .insert({
            numero: numeroReste,
            parent_id: tubeUtilisation.id,

            type: tubeUtilisation.type,
            matiere: tubeUtilisation.matiere,
            nuance: tubeUtilisation.nuance,
            section: tubeUtilisation.section,
            epaisseur: tubeUtilisation.epaisseur,

            longueur_commandee: reste,
            longueur_disponible: reste,


            statut: "disponible",
          })
          .select()
          .single();

        if (error) {
          throw new Error(
            `Impossible de créer le reste du tube : ${error.message}`
          );
        }

        tubeResultat = data;
      }

      // =====================================================
      // 3. ENREGISTRER LE MOUVEMENT
      // =====================================================

      const commentaire =
        reste > 0
          ? `Utilisation de ${longueur} mm. Reste ${reste} mm dans ${tubeResultat?.numero}.`
          : `Utilisation complète de ${longueur} mm. Aucun reste.`;

      const { error: erreurMouvement } =
        await supabase
          .from("stock_mouvements")
          .insert({
            tube_id: tubeUtilisation.id,
            type_mouvement: "utilisation",
            longueur,
            tube_source_id: tubeUtilisation.id,
            tube_resultat_id: tubeResultat?.id ?? null,
            commentaire,
          });

      if (erreurMouvement) {
        throw new Error(
          `L’utilisation a été enregistrée mais l’historique n’a pas pu être enregistré : ${erreurMouvement.message}`
        );
      }

      // =====================================================
      // 4. RAFRAICHIR LE STOCK
      // =====================================================

      await chargerStock();

      setModalUtilisationOuverte(false);
      setTubeUtilisation(null);
      setLongueurUtilisee("");

    } catch (error: any) {
      console.error(
        "Erreur utilisation :",
        error
      );

      setErreurUtilisation(
        error?.message ||
          "Une erreur est survenue pendant l’utilisation."
      );
    } finally {
      setEnregistrementUtilisation(false);
    }
  }

  const tubesFiltres = tubes.filter((tube) => {
    const terme = recherche.trim().toLowerCase();
    const okRecherche = !terme || [tube.numero, tube.matiere, tube.type, tube.section, tube.nuance ?? ""].some((v) => v.toLowerCase().includes(terme));
    return okRecherche && (!filtreMatiere || tube.matiere === filtreMatiere) && (!filtreType || tube.type === filtreType) && (!filtreSection || tube.section.toLowerCase().includes(filtreSection.toLowerCase())) && (!filtreNuance || (tube.nuance ?? "").toLowerCase().includes(filtreNuance.toLowerCase())) && (!filtreStatut || tube.statut === filtreStatut);
  });

  const filtresActifs = !!(recherche || filtreMatiere || filtreType || filtreSection || filtreNuance || filtreStatut !== "disponible");

  function reinitialiserFiltres() {
    setRecherche(""); setFiltreMatiere(""); setFiltreType(""); setFiltreSection(""); setFiltreNuance(""); setFiltreStatut("disponible");
  }

  async function ouvrirDetail(tube: StockTube) {
    setTubeDetail(tube); setHistoriqueTube([]); setErreurDetail(""); setModalDetailOuverte(true); setChargementHistorique(true);
    const { data, error } = await supabase.from("stock_mouvements").select("*").or(`tube_id.eq.${tube.id},tube_source_id.eq.${tube.id},tube_resultat_id.eq.${tube.id}`).order("date_mouvement", { ascending: false });
    if (error) setErreurDetail(error.message); else setHistoriqueTube(data ?? []);
    setChargementHistorique(false);
  }

  function fermerDetail() {
    if (chargementHistorique) return;
    setModalDetailOuverte(false); setTubeDetail(null); setHistoriqueTube([]); setErreurDetail("");
  }

  // =========================================================
  // REBUT
  // =========================================================

  function ouvrirRebut(tube: StockTube) {
    setTubeRebut(tube);
    setMotifRebut("");
    setErreurRebut("");
    setModalRebutOuverte(true);
  }

  function fermerRebut() {
    if (enregistrementRebut) return;

    setModalRebutOuverte(false);
    setTubeRebut(null);
    setMotifRebut("");
    setErreurRebut("");
  }

  async function enregistrerRebut() {
    setErreurRebut("");

    if (!tubeRebut) return;

    if (!motifRebut.trim()) {
      setErreurRebut("Veuillez renseigner le motif du rebut.");
      return;
    }

    setEnregistrementRebut(true);

    try {
      const longueurRebut = tubeRebut.longueur_disponible;

      const { error: erreurTube } = await supabase
        .from("stock_tubes")
        .update({
          statut: "rebut",
          longueur_disponible: 0,
        })
        .eq("id", tubeRebut.id);

      if (erreurTube) {
        throw new Error(
          `Impossible de mettre le tube au rebut : ${erreurTube.message}`
        );
      }

      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements")
        .insert({
          tube_id: tubeRebut.id,
          type_mouvement: "rebut",
          longueur: longueurRebut,
          tube_source_id: tubeRebut.id,
          tube_resultat_id: null,
          commentaire: `Rebut du tube ${tubeRebut.numero} : ${motifRebut.trim()}`,
        });

      if (erreurMouvement) {
        throw new Error(
          `Le tube a été mis au rebut mais l'historique n'a pas pu être enregistré : ${erreurMouvement.message}`
        );
      }

      await chargerStock();

      setModalRebutOuverte(false);
      setTubeRebut(null);
      setMotifRebut("");
    } catch (error: any) {
      console.error("Erreur rebut :", error);
      setErreurRebut(
        error?.message ||
          "Une erreur est survenue pendant la mise au rebut."
      );
    } finally {
      setEnregistrementRebut(false);
    }
  }

  // =========================================================
  // AFFICHAGE
  // =========================================================

  return (
    <div className="mx-auto max-w-7xl p-8">

      {/* =====================================================
          EN-TETE
      ===================================================== */}

      <div className="mb-8 flex items-center justify-between">

        <div>
          <div className="flex items-center gap-3">

            <Package
              size={32}
              className="text-[#F95516]"
            />

            <h1 className="text-4xl font-bold text-[#2F3437]">
              Stock tubes
            </h1>

          </div>

          <p className="mt-2 text-slate-500">
            Gestion des tubes disponibles dans l&apos;atelier
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirReception}
          className="flex items-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13]"
        >
          <Plus size={20} />
          Réceptionner un tube
        </button>

      </div>

      {/* =====================================================
          ERREUR
      ===================================================== */}

      {erreur && !modalOuverte && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Erreur :</strong> {erreur}
        </div>
      )}

      {/* =====================================================
          TABLEAU STOCK
      ===================================================== */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">Tubes en stock</h2>
              <p className="mt-1 text-sm text-slate-500">{(() => { const nombreDisponibles = tubesFiltres.filter((t) => t.statut === "disponible").length; return `${nombreDisponibles} ${nombreDisponibles > 1 ? "morceaux disponibles" : "morceau disponible"}`; })()}</p>
            </div>
            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">{tubesFiltres.length} / {tubes.length} tube(s)</div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Disponibles</p>
              <p className="mt-1 text-2xl font-bold text-green-800">{tubes.filter((t) => t.statut === "disponible").length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Utilisés</p>
              <p className="mt-1 text-2xl font-bold text-slate-700">{tubes.filter((t) => t.statut === "utilise").length}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Rebuts</p>
              <p className="mt-1 text-2xl font-bold text-red-800">{tubes.filter((t) => t.statut === "rebut").length}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher N°, matière, section..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100" />
            </div>
            <select value={filtreMatiere} onChange={(e) => setFiltreMatiere(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]">
              <option value="">Toutes les matières</option><option value="acier">Acier</option><option value="inox">Inox</option><option value="aluminium">Aluminium</option>
            </select>
            <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]">
              <option value="">Tous les types</option><option value="carre">Carré</option><option value="rectangulaire">Rectangulaire</option><option value="rond">Rond</option>
            </select>
            <input value={filtreSection} onChange={(e) => setFiltreSection(e.target.value)} placeholder="Section" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]" />
            <input value={filtreNuance} onChange={(e) => setFiltreNuance(e.target.value)} placeholder="Nuance" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]" />
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F95516]">
              <option value="">Tous les statuts</option>
              <option value="disponible">Disponible</option>
              <option value="utilise">Utilisé</option>
              <option value="rebut">Rebut</option>
            </select>
            <button
              type="button"
              onClick={() => setFiltreStatut(filtreStatut === "disponible" ? "" : "disponible")}
              className={filtreStatut === "disponible"
                ? "rounded-xl bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-700 ring-1 ring-green-200"
                : "rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"}
            >
              Disponibles uniquement
            </button>
            {filtresActifs && <button type="button" onClick={reinitialiserFiltres} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Réinitialiser les filtres</button>}
          </div>
        </div>

        {chargement ? (

          <div className="flex items-center justify-center p-16">

            <Loader2
              size={28}
              className="animate-spin text-[#F95516]"
            />

          </div>

        ) : tubes.length === 0 ? (

          <div className="p-16 text-center">

            <Package
              size={60}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-xl font-bold text-[#2F3437]">
              Aucun tube dans le stock
            </h2>

            <p className="mt-2 text-slate-500">
              Les tubes réceptionnés apparaîtront ici.
            </p>

          </div>

        ) : tubesFiltres.length === 0 ? (
          <div className="p-16 text-center">
            <Search size={52} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-xl font-bold text-[#2F3437]">Aucun tube ne correspond aux filtres</h2>
            <p className="mt-2 text-slate-500">Modifiez votre recherche ou réinitialisez les filtres.</p>
            <button type="button" onClick={reinitialiserFiltres} className="mt-5 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-[#e04d13]">Réinitialiser les filtres</button>
          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-500">

                  <th className="px-6 py-4 font-semibold">
                    N°
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Matière
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Type
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Section
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Épaisseur
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Longueur restante
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Réception
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Statut
                  </th>

                  <th className="px-6 py-4 font-semibold">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {tubesFiltres.map((tube) => (

                  <tr
                    key={tube.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >

                    <td className="px-6 py-4 font-bold text-[#2F3437]">
                      {tube.numero}
                    </td>

                    <td className="px-6 py-4">
                      {tube.matiere}
                    </td>

                    <td className="px-6 py-4">
                      {tube.type}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      {tube.section}
                    </td>

                    <td className="px-6 py-4">
                      {tube.epaisseur
                        ? `${tube.epaisseur} mm`
                        : "—"}
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      {tube.longueur_disponible} mm
                    </td>


                    <td className="px-6 py-4">

                      <span
                        className={
                          tube.statut === "disponible"
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            : tube.statut === "rebut"
                            ? "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                            : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                        }
                      >
                        {tube.statut === "disponible"
                          ? "Disponible"
                          : tube.statut === "rebut"
                          ? "Rebut"
                          : "Utilisé"}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-2">

                        <button
                          type="button"
                          title="Voir"
                          onClick={() => ouvrirDetail(tube)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#F95516]"
                        >
                          <Eye size={18} />
                        </button>

                        {tube.statut === "disponible" && (
                          <>
                            <button
                              type="button"
                              title="Utiliser le tube"
                              onClick={() =>
                                ouvrirUtilisation(tube)
                              }
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#F95516]"
                            >
                              <Ruler size={18} />
                            </button>

                            <button
                              type="button"
                              title="Mettre au rebut"
                              onClick={() => ouvrirRebut(tube)}
                              className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================================
          MODALE RECEPTION
      ===================================================== */}

      {modalOuverte && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerReception();
            }
          }}
        >

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">

              <div>
                <h2 className="text-2xl font-bold text-[#2F3437]">
                  Réceptionner un tube
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ajouter un nouveau tube physique au stock
                </p>
              </div>

              <button
                type="button"
                onClick={fermerReception}
                disabled={enregistrement}
                className="rounded-xl p-2 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={22} />
              </button>

            </div>

            <div className="space-y-6 p-8">

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Type *
                  </label>

                  <select
                    value={form.type}
                    onChange={(event) => {
                      modifierChamp("type", event.target.value);
                      modifierChamp("section", "");
                      setDimensionPersonnalisee(false);
                      setDimensionLargeur("");
                      setDimensionHauteur("");
                      setDimensionDiametre("");
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                  >

                    <option value="">
                      Sélectionner
                    </option>

                    <option value="carre">
                      Carré
                    </option>

                    <option value="rectangulaire">
                      Rectangulaire
                    </option>

                    <option value="rond">
                      Rond
                    </option>

                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Matière *
                  </label>

                  <select
                    value={form.matiere}
                    onChange={(event) => {
                      modifierChamp("matiere", event.target.value);
                      modifierChamp("nuance", "");
                      setNuancePersonnalisee(false);
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                  >

                    <option value="">
                      Sélectionner
                    </option>

                    {matieresStandard.map((matiere) => (
                      <option key={matiere} value={matiere}>
                        {matiere === "acier"
                          ? "Acier"
                          : matiere === "inox"
                          ? "Inox"
                          : "Aluminium"}
                      </option>
                    ))}

                  </select>
                </div>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nuance
                  </label>

                  {!nuancePersonnalisee ? (
                    <select
                      value={form.nuance}
                      onChange={(event) => {
                        if (event.target.value === "__personnalisee__") {
                          modifierChamp("nuance", "");
                          setNuancePersonnalisee(true);
                          return;
                        }
                        modifierChamp("nuance", event.target.value);
                      }}
                      disabled={!form.matiere}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Sélectionner</option>
                      {nuancesDisponibles.map((nuance) => (
                        <option key={nuance} value={nuance}>
                          {nuance}
                        </option>
                      ))}
                      <option value="__personnalisee__">+ Nuance personnalisée</option>
                    </select>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={form.nuance}
                        onChange={(event) => modifierChamp("nuance", event.target.value)}
                        placeholder="Ex. Satiné 316L"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNuancePersonnalisee(false);
                          modifierChamp("nuance", "");
                        }}
                        className="text-sm font-semibold text-[#F95516] hover:underline"
                      >
                        Revenir aux nuances disponibles
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Section *
                  </label>

                  {!dimensionPersonnalisee ? (
                    <select
                      value={form.section}
                      onChange={(event) => {
                        if (event.target.value === "__personnalisee__") {
                          modifierChamp("section", "");
                          setDimensionPersonnalisee(true);
                          return;
                        }

                        modifierChamp("section", event.target.value);
                      }}
                      disabled={!form.type}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.type
                          ? "Sélectionner une dimension"
                          : "Sélectionner d'abord le type"}
                      </option>

                      {(dimensionsStandard[form.type] ?? []).map((dimension) => (
                        <option key={dimension} value={dimension}>
                          {form.type === "rond" ? `Ø ${dimension}` : dimension}
                        </option>
                      ))}

                      {form.type && (
                        <option value="__personnalisee__">
                          + Dimension personnalisée
                        </option>
                      )}
                    </select>
                  ) : (
                    <div className="space-y-3">
                      {form.type === "rond" ? (
                        <div className="relative">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={dimensionDiametre}
                            onChange={(event) => {
                              setDimensionDiametre(event.target.value);
                              modifierChamp(
                                "section",
                                construireSection(
                                  form.type,
                                  "",
                                  "",
                                  event.target.value
                                )
                              );
                            }}
                            placeholder="Diamètre"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            mm
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={dimensionLargeur}
                              onChange={(event) => {
                                setDimensionLargeur(event.target.value);
                                modifierChamp(
                                  "section",
                                  construireSection(
                                    form.type,
                                    event.target.value,
                                    dimensionHauteur,
                                    ""
                                  )
                                );
                              }}
                              placeholder="Largeur"
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                              mm
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={dimensionHauteur}
                              onChange={(event) => {
                                setDimensionHauteur(event.target.value);
                                modifierChamp(
                                  "section",
                                  construireSection(
                                    form.type,
                                    dimensionLargeur,
                                    event.target.value,
                                    ""
                                  )
                                );
                              }}
                              placeholder="Hauteur"
                              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                              mm
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-500">
                          Section enregistrée :{" "}
                          <strong className="text-slate-700">
                            {form.section || "—"}
                          </strong>
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setDimensionPersonnalisee(false);
                            setDimensionLargeur("");
                            setDimensionHauteur("");
                            setDimensionDiametre("");
                            modifierChamp("section", "");
                          }}
                          className="text-sm font-semibold text-[#F95516] hover:underline"
                        >
                          Revenir aux standards
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    Les dimensions standards sont proposées automatiquement.
                    Une dimension personnalisée peut être saisie si nécessaire.
                  </p>
                </div>

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Épaisseur
                  </label>

                  {!epaisseurPersonnalisee ? (
                    <select
                      value={form.epaisseur}
                      onChange={(event) => {
                        if (event.target.value === "__personnalisee__") {
                          modifierChamp("epaisseur", "");
                          setEpaisseurPersonnalisee(true);
                          return;
                        }

                        modifierChamp("epaisseur", event.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">Sélectionner</option>

                      {epaisseursStandard.map((epaisseur) => (
                        <option key={epaisseur} value={epaisseur}>
                          {epaisseur} mm
                        </option>
                      ))}

                      <option value="__personnalisee__">
                        + Épaisseur personnalisée
                      </option>
                    </select>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={form.epaisseur}
                          onChange={(event) =>
                            modifierChamp("epaisseur", event.target.value)
                          }
                          placeholder="Ex. 2.7"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          mm
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEpaisseurPersonnalisee(false);
                          modifierChamp("epaisseur", "");
                        }}
                        className="text-sm font-semibold text-[#F95516] hover:underline"
                      >
                        Revenir aux épaisseurs standards
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Longueur commandée *
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.longueur_commandee}
                      onChange={(event) =>
                        modifierChamp(
                          "longueur_commandee",
                          event.target.value
                        )
                      }
                      placeholder="Ex. 6000"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      mm
                    </span>
                  </div>
                </div>

              </div>

              {erreur && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Erreur :</strong> {erreur}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">

                <button
                  type="button"
                  onClick={fermerReception}
                  disabled={enregistrement}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={enregistrerTube}
                  disabled={enregistrement}
                  className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white transition hover:bg-[#e04d13] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enregistrement ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={18} />

                      Réceptionner
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          MODALE REBUT
      ===================================================== */}

      {modalRebutOuverte && tubeRebut && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerRebut();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-red-50 p-2">
                    <Trash2 size={22} className="text-red-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-[#2F3437]">
                    Mettre au rebut
                  </h2>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Le tube restera enregistré mais ne sera plus disponible.
                </p>
              </div>

              <button
                type="button"
                onClick={fermerRebut}
                disabled={enregistrementRebut}
                className="rounded-xl p-2 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-8">

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="grid grid-cols-2 gap-5">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Tube
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#2F3437]">
                      {tubeRebut.numero}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Longueur restante
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#2F3437]">
                      {tubeRebut.longueur_disponible} mm
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Matière
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {tubeRebut.matiere}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Section
                    </p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {tubeRebut.section}
                    </p>
                  </div>

                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Motif du rebut *
                </label>

                <textarea
                  value={motifRebut}
                  onChange={(event) => {
                    setMotifRebut(event.target.value);
                    setErreurRebut("");
                  }}
                  rows={4}
                  autoFocus
                  placeholder="Ex. Tube déformé, oxydé, trop court, défaut matière..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <strong>Attention :</strong> le tube sera marqué comme rebut,
                sa longueur disponible passera à 0 mm et il ne sera pas supprimé.
              </div>

              {erreurRebut && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Erreur :</strong> {erreurRebut}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">

                <button
                  type="button"
                  onClick={fermerRebut}
                  disabled={enregistrementRebut}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={enregistrerRebut}
                  disabled={enregistrementRebut}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enregistrementRebut ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Mise au rebut...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Confirmer le rebut
                    </>
                  )}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {modalDetailOuverte && tubeDetail && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) fermerDetail(); }}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
              <div><div className="flex items-center gap-3"><div className="rounded-xl bg-orange-50 p-2"><Eye size={22} className="text-[#F95516]" /></div><h2 className="text-2xl font-bold text-[#2F3437]">Détail du tube</h2></div><p className="mt-2 text-sm text-slate-500">Informations et historique du morceau physique</p></div>
              <button type="button" onClick={fermerDetail} disabled={chargementHistorique} className="rounded-xl p-2 hover:bg-slate-100 disabled:opacity-50"><X size={22} /></button>
            </div>
            <div className="space-y-6 p-8">
              <div className="rounded-2xl bg-slate-50 p-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Numéro</span>
                <div className="text-2xl font-bold text-[#2F3437]">{tubeDetail.numero}</div>
                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  {[["Matière",tubeDetail.matiere],["Type",tubeDetail.type],["Nuance",tubeDetail.nuance || "—"],["Section",tubeDetail.section],["Épaisseur",tubeDetail.epaisseur != null ? `${tubeDetail.epaisseur} mm` : "—"],["Statut",tubeDetail.statut === "disponible" ? "Disponible" : tubeDetail.statut === "rebut" ? "Rebut" : "Utilisé"],["Longueur commandée",`${tubeDetail.longueur_commandee} mm`],["Longueur restante",`${tubeDetail.longueur_disponible} mm`],["Tube parent",tubeDetail.parent_id ? (tubes.find(t => t.id === tubeDetail.parent_id)?.numero || `#${tubeDetail.parent_id}`) : "Tube d'origine"]].map(([label,value]) => <div key={label}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 font-semibold ${label === "Longueur restante" ? "text-[#F95516]" : "text-slate-700"}`}>{value}</p></div>)}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2F3437]">Historique</h3>
                {chargementHistorique ? <div className="flex justify-center p-10"><Loader2 size={26} className="animate-spin text-[#F95516]" /></div> : erreurDetail ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><strong>Erreur :</strong> {erreurDetail}</div> : historiqueTube.length === 0 ? <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucun mouvement enregistré.</div> : <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Mouvement</th><th className="px-5 py-3">Longueur</th><th className="px-5 py-3">Commentaire</th></tr></thead><tbody>{historiqueTube.map((m) => <tr key={m.id} className="border-t border-slate-200"><td className="px-5 py-4">{new Date(m.date_mouvement).toLocaleString("fr-FR")}</td><td className="px-5 py-4 font-semibold">{m.type_mouvement === "reception" ? "Réception" : m.type_mouvement === "utilisation" ? "Utilisation" : "Rebut"}</td><td className="px-5 py-4 font-semibold">{m.longueur != null ? `${m.longueur} mm` : "—"}</td><td className="px-5 py-4">{m.commentaire || "—"}</td></tr>)}</tbody></table></div></div>}
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-6"><button type="button" onClick={fermerDetail} disabled={chargementHistorique} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Fermer</button></div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODALE UTILISATION
      ===================================================== */}

      {modalUtilisationOuverte && tubeUtilisation && (

        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fermerUtilisation();
            }
          }}
        >

          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">

              <div>

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-orange-50 p-2">
                    <Ruler
                      size={22}
                      className="text-[#F95516]"
                    />
                  </div>

                  <h2 className="text-2xl font-bold text-[#2F3437]">
                    Utiliser le tube
                  </h2>

                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Indiquer la longueur utilisée. Le reste sera conservé automatiquement.
                </p>

              </div>

              <button
                type="button"
                onClick={fermerUtilisation}
                disabled={enregistrementUtilisation}
                className="rounded-xl p-2 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={22} />
              </button>

            </div>

            {/* CONTENU */}

            <div className="space-y-6 p-8">

              {/* INFORMATIONS TUBE */}

              <div className="rounded-2xl bg-slate-50 p-5">

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Tube
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#2F3437]">
                      {tubeUtilisation.numero}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Longueur restante
                    </p>

                    <p className="mt-1 text-lg font-bold text-[#2F3437]">
                      {tubeUtilisation.longueur_disponible} mm
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Matière
                    </p>

                    <p className="mt-1 font-semibold text-slate-700">
                      {tubeUtilisation.matiere}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Section
                    </p>

                    <p className="mt-1 font-semibold text-slate-700">
                      {tubeUtilisation.section}
                    </p>
                  </div>

                </div>

              </div>

              {/* LONGUEUR UTILISEE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Longueur utilisée *
                </label>

                <div className="relative">

                  <input
                    type="number"
                    min="1"
                    max={tubeUtilisation.longueur_disponible}
                    step="1"
                    autoFocus
                    value={longueurUtilisee}
                    onChange={(event) => {
                      setLongueurUtilisee(
                        event.target.value
                      );
                      setErreurUtilisation("");
                    }}
                    placeholder="Ex. 2500"
                    className="w-full rounded-xl border border-slate-300 px-4 py-4 pr-16 text-lg outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    mm
                  </span>

                </div>

              </div>

              {/* CALCUL */}

              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">

                <div className="flex items-center justify-between">

                  <span className="font-semibold text-slate-600">
                    Longueur restante
                  </span>

                  <span
                    className={
                      longueurRestante < 0
                        ? "text-xl font-bold text-red-600"
                        : "text-xl font-bold text-[#F95516]"
                    }
                  >
                    {longueurUtilisee
                      ? `${longueurRestante} mm`
                      : "—"}
                  </span>

                </div>

                {longueurUtilisee &&
                  longueurRestante > 0 && (
                    <p className="mt-2 text-sm text-slate-500">
                      Le reste sera conservé automatiquement comme nouveau morceau disponible.
                    </p>
                  )}

                {longueurUtilisee &&
                  longueurRestante === 0 && (
                    <p className="mt-2 text-sm text-slate-500">
                      La totalité du tube sera utilisée. Aucun reste ne sera créé.
                    </p>
                  )}

              </div>

              {/* ERREUR */}

              {erreurUtilisation && (

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <strong>Erreur :</strong>{" "}
                  {erreurUtilisation}
                </div>

              )}

              {/* BOUTONS */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">

                <button
                  type="button"
                  onClick={fermerUtilisation}
                  disabled={enregistrementUtilisation}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={enregistrerUtilisation}
                  disabled={enregistrementUtilisation}
                  className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white transition hover:bg-[#e04d13] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enregistrementUtilisation ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

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