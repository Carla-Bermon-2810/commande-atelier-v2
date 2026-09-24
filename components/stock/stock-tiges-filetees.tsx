"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Ruler,
  Save,
  Search,
  Trash2,
  X,
  Package,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Tige = {
  id: number;
  numero: string;
  parent_id: number | null;
  matiere: string;
  diametre: string;
  longueur_commandee: number;
  longueur_disponible: number;
  statut: "disponible" | "utilise";
  created_at: string;
};

type Mouvement = {
  id: number;
  tige_id: number | null;
  type_mouvement: "reception" | "utilisation";
  longueur: number | null;
  tige_source_id: number | null;
  tige_resultat_id: number | null;
  commentaire: string | null;
  date_mouvement: string;
};

const matieres = ["acier", "alu", "inox"];

const diametres: Record<string, string[]> = {
  acier: ["Ø4", "Ø5", "Ø6", "Ø8", "Ø10", "Ø12", "Ø14", "Ø16", "Ø18"],
  alu: ["Ø8"],
  inox: ["Ø4", "Ø5", "Ø6", "Ø8", "Ø10", "Ø12", "Ø27"],
};

const formInitial = {
  matiere: "acier",
  diametre: "Ø8",
  longueur_commandee: "1000",
};

function normaliserMatiere(value: string) {
  return value.trim().toLowerCase();
}

function normaliserDiametre(value: string) {
  const propre = value.trim().replace(/\s+/g, "");
  if (!propre) return "";
  return propre.startsWith("Ø") ? propre : `Ø${propre}`;
}

function estReste(tige: Tige) {
  return Boolean(tige.parent_id) || /-R\d+$/i.test(tige.numero);
}

function TigeGroupRow({
  groupe,
  ouvert,
  onToggle,
  onUse,
  onDelete,
}: {
  groupe: {
    key: string;
    matiere: string;
    diametre: string;
    morceaux: Tige[];
    morceauxFiltres: Tige[];
    nombreDisponibles: number;
    longueurDisponible: number;
  };
  ouvert: boolean;
  onToggle: () => void;
  onUse: (tige: Tige) => void;
  onDelete: (tige: Tige) => void;
}) {
  return (
    <Fragment key={groupe.key}>
      <tr className="border-b border-slate-100 bg-white transition hover:bg-slate-50">
        <td className="w-10 px-4 py-4">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#F95516]"
            title={ouvert ? "Réduire" : "Voir les morceaux"}
          >
            {ouvert ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
          </button>
        </td>
        <td className="px-4 py-4 font-semibold text-[#2F3437]">
        {groupe.matiere.charAt(0).toUpperCase() + groupe.matiere.slice(1)}
        </td>
        <td className="px-4 py-4 font-semibold text-[#2F3437]">
          {groupe.diametre}
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
              {groupe.nombreDisponibles} morceau(x)
            </span>
            <span className="font-bold text-[#2F3437]">
              {groupe.longueurDisponible.toLocaleString("fr-FR")} mm
            </span>
          </div>
        </td>
        <td className="px-4 py-4 text-right">
          <span className="text-xs font-medium text-slate-400">
            {ouvert ? "Masquer" : "Détails"}
          </span>
        </td>
      </tr>

      {ouvert && (
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <td colSpan={5} className="px-10 py-3">
            <div className="rounded-2xl border border-slate-200 bg-white">
              {groupe.morceauxFiltres.map((tige, index) => {
                const plein = tige.statut === "disponible" && !estReste(tige);
                return (
                  <div
                    key={tige.id}
                    className={`flex items-center justify-between gap-4 px-4 py-3 ${
                      index !== groupe.morceauxFiltres.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 flex-none rounded-full ${
                          tige.statut === "utilise"
                            ? "bg-slate-300"
                            : plein
                              ? "bg-green-500"
                              : "bg-[#F95516]"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#2F3437]">
                            {tige.numero}
                          </span>
                          {tige.statut === "disponible" && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                plein
                                  ? "bg-green-50 text-green-700"
                                  : "bg-orange-50 text-[#F95516]"
                              }`}
                            >
                              {plein ? "Tige pleine" : "Reste"}
                            </span>
                          )}
                          {tige.statut === "utilise" && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                              Utilisée
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-none items-center gap-5">
                      <span className="min-w-[100px] text-right font-semibold text-[#2F3437]">
                        {Number(tige.longueur_disponible).toLocaleString("fr-FR")} mm
                      </span>
                      {tige.statut === "disponible" ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Utiliser la tige"
                            onClick={() => onUse(tige)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#F95516]"
                          >
                            <Ruler size={18} />
                          </button>
                          <button
                            type="button"
                            title="Retirer du stock"
                            onClick={() => onDelete(tige)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="w-[76px]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 px-1 text-xs text-slate-400">
              Vert = tige pleine · Orange = reste
            </p>
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export default function StockTigesFiletees() {
  const [tiges, setTiges] = useState<Tige[]>([]);
  const [chargement, setChargement] = useState(true);

  const [modalOuverte, setModalOuverte] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [form, setForm] = useState(formInitial);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("");
  const [diametreFiltre, setDiametreFiltre] = useState("");

  const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(new Set());

  const [tigeUtilisation, setTigeUtilisation] = useState<Tige | null>(null);
  const [longueurRestanteSaisie, setLongueurRestanteSaisie] = useState("");
  const [erreurUtilisation, setErreurUtilisation] = useState("");
  const [enregistrementUtilisation, setEnregistrementUtilisation] = useState(false);

  const [tigeDetail, setTigeDetail] = useState<Tige | null>(null);
  const [historique, setHistorique] = useState<Mouvement[]>([]);
  const [chargementHistorique, setChargementHistorique] = useState(false);

  async function chargerStock() {
    setChargement(true);
    setErreur("");

    const { data, error } = await supabase
      .from("stock_tiges_filetees")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erreur chargement tiges :", error);
      setErreur(error.message);
    } else {
      setTiges((data ?? []) as Tige[]);
    }

    setChargement(false);
  }

  useEffect(() => {
    chargerStock();
  }, []);

  const diametresForm = diametres[form.matiere] ?? [];

  const tigesFiltrees = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();

    return tiges.filter((tige) => {
      const diametreNormalise = normaliserDiametre(tige.diametre);
      const correspondRecherche =
        !rechercheNormalisee ||
        tige.numero.toLowerCase().includes(rechercheNormalisee) ||
        tige.matiere.toLowerCase().includes(rechercheNormalisee) ||
        diametreNormalise.toLowerCase().includes(rechercheNormalisee) ||
        tige.diametre.toLowerCase().includes(rechercheNormalisee);

      const correspondMatiere =
        !matiereFiltre || normaliserMatiere(tige.matiere) === normaliserMatiere(matiereFiltre);
      const correspondDiametre =
        !diametreFiltre || normaliserDiametre(tige.diametre) === diametreFiltre;
      const correspondStatut = tige.statut === "disponible";

      return correspondRecherche && correspondMatiere && correspondDiametre && correspondStatut;
    });
  }, [tiges, recherche, matiereFiltre, diametreFiltre]);

  const groupes = useMemo(() => {
    const map = new Map<string, Tige[]>();

    for (const tige of tigesFiltrees) {
      const matiere = normaliserMatiere(tige.matiere);
      const diametre = normaliserDiametre(tige.diametre);
      const key = `${matiere}|${diametre}`;
      const liste = map.get(key) ?? [];
      liste.push(tige);
      map.set(key, liste);
    }

    return Array.from(map.entries())
  .map(([key, liste]) => {
    const [matiere, diametre] = key.split("|");

    const tousLesMorceaux = tiges.filter(
      (tige) =>
        normaliserMatiere(tige.matiere) === matiere &&
        normaliserDiametre(tige.diametre) === diametre
    );

    const disponibles = tousLesMorceaux.filter(
      (tige) => tige.statut === "disponible"
    );

    const longueurDisponible = disponibles.reduce(
      (total, tige) =>
        total + Number(tige.longueur_disponible || 0),
      0
    );

    return {
      key,
      matiere,
      diametre,
      morceaux: tousLesMorceaux,
      morceauxFiltres: liste,
      nombreDisponibles: disponibles.length,
      longueurDisponible,
    };
  })
  .sort((a, b) => {
    const ordreMatiere: Record<string, number> = {
      acier: 1,
      alu: 2,
      inox: 3,
    };

    const matiereA = ordreMatiere[a.matiere] ?? 99;
    const matiereB = ordreMatiere[b.matiere] ?? 99;

    if (matiereA !== matiereB) {
      return matiereA - matiereB;
    }

    const diametreA = Number(
      a.diametre.replace("Ø", "").replace(",", ".")
    );

    const diametreB = Number(
      b.diametre.replace("Ø", "").replace(",", ".")
    );

    return diametreA - diametreB;
  });
  }, [tiges, tigesFiltrees]);

  const nombreDisponibles = tiges.filter(
    (tige) => tige.statut === "disponible"
  ).length;
  
  const nombreDisponiblesFiltres = tigesFiltrees.length;
  function basculerGroupe(key: string) {
    setGroupesOuverts((precedent) => {
      const prochain = new Set(precedent);
      if (prochain.has(key)) prochain.delete(key);
      else prochain.add(key);
      return prochain;
    });
  }

  async function genererNumeroTige() {
    const { data, error } = await supabase
      .from("stock_tiges_filetees")
      .select("numero")
      .like("numero", "TF-%");

    if (error) throw new Error(error.message);

    let dernierNumero = 0;
    for (const tige of data ?? []) {
      const match = tige.numero?.match(/^TF-(\d+)$/);
      if (match) dernierNumero = Math.max(dernierNumero, Number(match[1]));
    }

    return `TF-${String(dernierNumero + 1).padStart(4, "0")}`;
  }

  async function genererNumeroReste(tigeSource: Tige) {
    const numeroRacine = tigeSource.numero.split("-R")[0];

    const { data, error } = await supabase
      .from("stock_tiges_filetees")
      .select("numero")
      .like("numero", `${numeroRacine}-R%`);

    if (error) throw new Error(error.message);

    let dernierRang = 0;
    for (const tige of data ?? []) {
      const match = tige.numero?.match(/-R(\d+)$/);
      if (match) dernierRang = Math.max(dernierRang, Number(match[1]));
    }

    return `${numeroRacine}-R${String(dernierRang + 1).padStart(2, "0")}`;
  }

  function ouvrirReception() {
    setForm(formInitial);
    setErreur("");
    setMessage("");
    setModalOuverte(true);
  }

  function fermerReception() {
    if (enregistrement) return;
    setModalOuverte(false);
    setErreur("");
  }

  async function enregistrerReception() {
    setErreur("");
    setMessage("");

    const longueur = Number(form.longueur_commandee);

    if (!form.matiere) return setErreur("Veuillez sélectionner une matière.");
    if (!form.diametre) return setErreur("Veuillez sélectionner un diamètre.");
    if (!Number.isFinite(longueur) || longueur <= 0) {
      return setErreur("La longueur doit être supérieure à 0 mm.");
    }

    setEnregistrement(true);

    try {
      const numero = await genererNumeroTige();
      const diametreNormalise = normaliserDiametre(form.diametre);

      const { data, error } = await supabase
        .from("stock_tiges_filetees")
        .insert({
          numero,
          parent_id: null,
          matiere: form.matiere,
          diametre: diametreNormalise,
          longueur_commandee: longueur,
          longueur_disponible: longueur,
          statut: "disponible",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      await supabase.from("stock_mouvements_tiges").insert({
        tige_id: data.id,
        type_mouvement: "reception",
        longueur,
        tige_source_id: null,
        tige_resultat_id: data.id,
        commentaire: `Réception de la tige ${numero}`,
      });

      setMessage(`Tige ${numero} enregistrée avec succès.`);
      await chargerStock();

      setTimeout(() => {
        setModalOuverte(false);
        setMessage("");
      }, 800);
    } catch (error: any) {
      console.error(error);
      setErreur(error?.message || "Une erreur est survenue.");
    } finally {
      setEnregistrement(false);
    }
  }

  async function ouvrirDetail(tige: Tige) {
    setTigeDetail(tige);
    setHistorique([]);
    setChargementHistorique(true);

    const { data, error } = await supabase
      .from("stock_mouvements_tiges")
      .select("*")
      .or(
        `tige_id.eq.${tige.id},tige_source_id.eq.${tige.id},tige_resultat_id.eq.${tige.id}`
      )
      .order("date_mouvement", { ascending: false });

    if (!error) setHistorique((data ?? []) as Mouvement[]);
    setChargementHistorique(false);
  }

  function fermerDetail() {
    setTigeDetail(null);
    setHistorique([]);
  }

  function ouvrirUtilisation(tige: Tige) {
    setTigeUtilisation(tige);
    setLongueurRestanteSaisie(String(tige.longueur_disponible));
    setErreurUtilisation("");
  }

  function fermerUtilisation() {
    if (enregistrementUtilisation) return;
    setTigeUtilisation(null);
    setLongueurRestanteSaisie("");
    setErreurUtilisation("");
  }

  async function enregistrerUtilisation() {
    setErreurUtilisation("");
    if (!tigeUtilisation) return;

    const longueurRestante = Number(longueurRestanteSaisie);

    if (
      longueurRestanteSaisie === "" ||
      !Number.isFinite(longueurRestante) ||
      longueurRestante < 0
    ) {
      return setErreurUtilisation("Veuillez renseigner une longueur restante valide.");
    }

    if (longueurRestante > tigeUtilisation.longueur_disponible) {
      return setErreurUtilisation(
        `La longueur restante ne peut pas dépasser la longueur actuelle (${tigeUtilisation.longueur_disponible} mm).`
      );
    }

    const longueurUtilisee =
      tigeUtilisation.longueur_disponible - longueurRestante;

    if (longueurUtilisee <= 0) {
      return setErreurUtilisation("La longueur restante doit être inférieure à la longueur actuelle.");
    }

    setEnregistrementUtilisation(true);

    try {
      const { error: erreurSource } = await supabase
        .from("stock_tiges_filetees")
        .update({ longueur_disponible: 0, statut: "utilise" })
        .eq("id", tigeUtilisation.id);

      if (erreurSource) throw new Error(erreurSource.message);

      let tigeResultat: Tige | null = null;

      if (longueurRestante > 0) {
        const numeroReste = await genererNumeroReste(tigeUtilisation);

        const { data, error } = await supabase
          .from("stock_tiges_filetees")
          .insert({
            numero: numeroReste,
            parent_id: tigeUtilisation.id,
            matiere: tigeUtilisation.matiere,
            diametre: normaliserDiametre(tigeUtilisation.diametre),
            longueur_commandee: longueurRestante,
            longueur_disponible: longueurRestante,
            statut: "disponible",
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        tigeResultat = data;
      }

      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements_tiges")
        .insert({
          tige_id: tigeUtilisation.id,
          type_mouvement: "utilisation",
          longueur: longueurUtilisee,
          tige_source_id: tigeUtilisation.id,
          tige_resultat_id: tigeResultat?.id ?? null,
          commentaire:
            longueurRestante > 0
              ? `Utilisation de ${longueurUtilisee} mm. Reste ${longueurRestante} mm dans ${tigeResultat?.numero}.`
              : `Utilisation complète de ${longueurUtilisee} mm.`,
        });

      if (erreurMouvement) console.error("Erreur historique utilisation :", erreurMouvement);

      await chargerStock();
      fermerUtilisation();
    } catch (error: any) {
      console.error(error);
      setErreurUtilisation(error?.message || "Une erreur est survenue.");
    } finally {
      setEnregistrementUtilisation(false);
    }
  }

  async function supprimerTige(tige: Tige) {
    const confirme = window.confirm(
      `Supprimer ${tige.numero} du stock ?\n\nCette action retirera définitivement ce morceau du stock.`
    );
    if (!confirme) return;

    try {
      setErreur("");

      // On retire d'abord les mouvements liés pour éviter un blocage de clé étrangère.
      const { error: mouvementsError } = await supabase
        .from("stock_mouvements_tiges")
        .delete()
        .or(
          `tige_id.eq.${tige.id},tige_source_id.eq.${tige.id},tige_resultat_id.eq.${tige.id}`
        );

      if (mouvementsError) throw new Error(mouvementsError.message);

      const { error } = await supabase
        .from("stock_tiges_filetees")
        .delete()
        .eq("id", tige.id);

      if (error) throw new Error(error.message);

      setTiges((precedentes) => precedentes.filter((item) => item.id !== tige.id));
    } catch (error: any) {
      console.error("Erreur suppression tige :", error);
      setErreur(error?.message || "Impossible de supprimer cette tige.");
    }
  }

  function formaterDate(date: string) {
    return new Date(date).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function libelleMouvement(mouvement: Mouvement) {
    if (mouvement.type_mouvement === "reception") return "Réception";
    if (mouvement.type_mouvement === "utilisation") return "Utilisation";
    return "Mouvement";
  }

  const longueurRestanteAffichee = tigeUtilisation
    ? Number(longueurRestanteSaisie || 0)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-8 pb-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package size={34} className="text-[#F95516]" />
            <h1 className="text-3xl font-bold text-[#2F3437]">Stock tiges filetées</h1>
          </div>
          <p className="mt-1 text-slate-500">Gestion des tiges filetées disponibles dans l'atelier</p>
        </div>

        <button
          type="button"
          onClick={ouvrirReception}
          className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          <Plus size={20} />
          Réceptionner une tige
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-xl font-bold text-[#2F3437]">Tiges filetées en stock</h2>
            <p className="mt-3 text-sm text-slate-500">
              {nombreDisponibles} morceau{nombreDisponibles > 1 ? "x" : ""} disponible{nombreDisponibles > 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-semibold text-[#F95516]">
          {nombreDisponiblesFiltres} / {nombreDisponibles} tige(s)
          </div>
        </div>

        <div className="border-b border-slate-200 px-6 pb-5">
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher N°, matière, diamètre..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#F95516]"
              />
            </div>

            <select
              value={matiereFiltre}
              onChange={(e) => setMatiereFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="">Toutes les matières</option>
              {matieres.map((matiere) => (
                <option key={matiere} value={matiere}>{matiere.toUpperCase()}</option>
              ))}
            </select>

            <select
              value={diametreFiltre}
              onChange={(e) => setDiametreFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="">Tous les diamètres</option>
              {Array.from(new Set(Object.values(diametres).flat())).map((diametre) => (
                <option key={diametre} value={diametre}>{diametre}</option>
              ))}
            </select>

          </div>

        </div>

        {erreur && (
          <div className="mx-6 mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{erreur}</div>
        )}

        {chargement ? (
          <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
            <Loader2 size={22} className="animate-spin" /> Chargement du stock...
          </div>
        ) : groupes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Aucune tige ne correspond aux critères.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-500">
                  <th className="w-10 px-4 py-4"></th>
                  <th className="px-4 py-4 text-left">Matière</th>
                  <th className="px-4 py-4 text-left">Diamètre</th>
                  <th className="px-4 py-4 text-left">Stock</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupes.map((groupe) => (
                  <TigeGroupRow
                    key={groupe.key}
                    groupe={groupe}
                    ouvert={groupesOuverts.has(groupe.key)}
                    onToggle={() => basculerGroupe(groupe.key)}
                    onUse={ouvrirUtilisation}
                    onDelete={supprimerTige}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOuverte && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#2F3437]">Réceptionner une tige</h2>
                <p className="mt-1 text-sm text-slate-500">Longueur par défaut : 1 000 mm</p>
              </div>
              <button type="button" onClick={fermerReception} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Matière</label>
                <select
                  value={form.matiere}
                  onChange={(e) => {
                    const matiere = e.target.value;
                    setForm({ ...form, matiere, diametre: diametres[matiere]?.[0] ?? "" });
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                >
                  {matieres.map((matiere) => <option key={matiere} value={matiere}>{matiere.toUpperCase()}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Diamètre</label>
                <select
                  value={form.diametre}
                  onChange={(e) => setForm({ ...form, diametre: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                >
                  {diametresForm.map((diametre) => <option key={diametre} value={diametre}>{diametre}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Longueur commandée (mm)</label>
                <input
                  type="number"
                  min="1"
                  value={form.longueur_commandee}
                  onChange={(e) => setForm({ ...form, longueur_commandee: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />
              </div>

              {erreur && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erreur}</div>}
              {message && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">{message}</div>}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={fermerReception} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Annuler</button>
                <button
                  type="button"
                  onClick={enregistrerReception}
                  disabled={enregistrement}
                  className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {enregistrement ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tigeUtilisation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-7 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#2F3437]">Utiliser la tige</h2>
                  <p className="mt-1 text-sm text-slate-500">Saisissez directement la longueur qu'il restera.</p>
                </div>
                <button type="button" onClick={fermerUtilisation} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="space-y-6 px-7 py-7">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 rounded-2xl bg-slate-50 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tige</p>
                  <p className="mt-1 font-bold text-[#2F3437]">{tigeUtilisation.numero}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Longueur actuelle</p>
                  <p className="mt-1 font-bold text-[#2F3437]">{tigeUtilisation.longueur_disponible.toLocaleString("fr-FR")} mm</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Matière</p>
                  <p className="mt-1 font-bold capitalize text-[#2F3437]">{tigeUtilisation.matiere}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diamètre</p>
                  <p className="mt-1 font-bold text-[#2F3437]">{normaliserDiametre(tigeUtilisation.diametre)}</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Nouvelle longueur restante *</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={tigeUtilisation.longueur_disponible}
                    value={longueurRestanteSaisie}
                    onChange={(e) => setLongueurRestanteSaisie(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-4 pr-14 text-lg outline-none transition focus:border-[#F95516]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">mm</span>
                </div>
              </div>

              {erreurUtilisation && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erreurUtilisation}</div>}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button type="button" onClick={fermerUtilisation} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Annuler</button>
                <button
                  type="button"
                  onClick={enregistrerUtilisation}
                  disabled={enregistrementUtilisation}
                  className="flex items-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {enregistrementUtilisation ? <Loader2 size={18} className="animate-spin" /> : <Ruler size={18} />}
                  Valider l'utilisation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tigeDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-7 py-6">
              <div>
                <h2 className="text-2xl font-bold text-[#2F3437]">Historique de la tige</h2>
                <p className="mt-1 text-sm text-slate-500">{tigeDetail.numero} · {normaliserDiametre(tigeDetail.diametre)}</p>
              </div>
              <button type="button" onClick={fermerDetail} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={22} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-7">
              {chargementHistorique ? (
                <div className="flex items-center justify-center gap-2 p-10 text-slate-500"><Loader2 size={20} className="animate-spin" /> Chargement...</div>
              ) : historique.length === 0 ? (
                <p className="py-10 text-center text-slate-500">Aucun mouvement.</p>
              ) : (
                <div className="space-y-3">
                  {historique.map((mouvement) => (
                    <div key={mouvement.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[#2F3437]">{libelleMouvement(mouvement)}</p>
                          <p className="mt-1 text-sm text-slate-500">{mouvement.commentaire || "—"}</p>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <p>{mouvement.longueur != null ? `${mouvement.longueur.toLocaleString("fr-FR")} mm` : "—"}</p>
                          <p className="mt-1">{formaterDate(mouvement.date_mouvement)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
