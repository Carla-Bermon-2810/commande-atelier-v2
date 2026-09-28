"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleAlert,
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
import { LengthStockStatusBadge, LengthThresholdCell } from "@/components/stock/LengthThresholdCell";
import {
  buildTigeReferenceKey,
  calculateStockAlertStatus,
  type StockAlertDisplayStatus,
} from "@/lib/stock-alerts";
import { notifyStockAlertsUpdated } from "@/lib/stock-alerts-client";

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

function messageErreur(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
  onSaveThreshold,
  onDetail,
}: {
  groupe: {
    key: string;
    matiere: string;
    diametre: string;
    morceaux: Tige[];
    morceauxFiltres: Tige[];
    nombreDisponibles: number;
    longueurDisponible: number;
    longueursDisponibles: number[];
    seuil: number | null;
    statut: StockAlertDisplayStatus;
  };
  ouvert: boolean;
  onToggle: () => void;
  onUse: (tige: Tige) => void;
  onDelete: (tige: Tige) => void;
  onSaveThreshold: (referenceKey: string, seuil: number | null) => Promise<boolean>;
  onDetail: (tige: Tige) => void;
}) {
  const rowTone = groupe.statut === "rupture"
    ? "bg-red-50/70 hover:bg-red-50"
    : groupe.statut === "a_recommander"
      ? "bg-orange-50/70 hover:bg-orange-50"
      : "bg-white hover:bg-slate-50";
  return (
    <Fragment key={groupe.key}>
      <tr className={`border-b border-slate-100 transition ${rowTone}`}>
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
        <td className="px-4 py-4"><span className="inline-flex whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{groupe.nombreDisponibles} morceau{groupe.nombreDisponibles > 1 ? "x" : ""}</span></td>
        <td className="px-4 py-4 font-bold text-[#17232b]">{groupe.longueurDisponible.toLocaleString("fr-FR")} mm</td>
        <td className="px-4 py-4">
          {groupe.longueursDisponibles.length > 0 ? (
            <div className="flex min-w-[180px] flex-wrap gap-1.5">
              {groupe.longueursDisponibles.map((longueur, index) => (
                <span key={`${groupe.key}:${longueur}:${index}`} className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{longueur.toLocaleString("fr-FR")} mm</span>
              ))}
            </div>
          ) : "—"}
        </td>
        <td className="px-4 py-4">
          <LengthThresholdCell
            seuil={groupe.seuil}
            onSave={(seuil) => onSaveThreshold(groupe.key, seuil)}
          />
        </td>
        <td className="px-4 py-4">
          <LengthStockStatusBadge statut={groupe.statut} />
        </td>
        <td className="px-4 py-4 text-right">
          <button type="button" onClick={() => onDetail(groupe.morceaux.find((tige) => tige.statut === "disponible") ?? groupe.morceaux[0])} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-[#F95516]">
            {ouvert ? "Masquer" : "Détails"}
          </button>
        </td>
      </tr>

      {ouvert && (
        <tr className="border-b border-slate-100 bg-slate-50/70">
          <td colSpan={9} className="px-10 py-3">
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
  const [seuils, setSeuils] = useState<Record<string, number>>({});

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
    try {
      const [stockResult, seuilsResult] = await Promise.all([
        supabase.from("stock_tiges_filetees").select("*").order("id", { ascending: false }),
        fetch("/api/stock/seuils-longueur?source=tiges_filetees"),
      ]);
      const { data, error } = stockResult;
      if (error) throw error;
      setTiges((data ?? []) as Tige[]);
      notifyStockAlertsUpdated();
      if (!seuilsResult.ok) throw new Error("Le stock est chargé, mais les seuils de longueur sont indisponibles.");
      const payload = await seuilsResult.json() as { seuils?: Array<{ reference_key: string; seuil_mm: number }> };
      setSeuils(Object.fromEntries((payload.seuils ?? []).map((seuil) => [seuil.reference_key, Number(seuil.seuil_mm)])));
    } catch (error) {
      console.error("Erreur chargement tiges :", error);
      setErreur(error instanceof Error ? error.message : "Impossible de charger les tiges filetées.");
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void chargerStock(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const diametresForm = diametres[form.matiere] ?? [];

  const tigesCorrespondantes = useMemo(() => {
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
      return correspondRecherche && correspondMatiere && correspondDiametre;
    });
  }, [tiges, recherche, matiereFiltre, diametreFiltre]);

  const groupes = useMemo(() => {
    const map = new Map<string, Tige[]>();

    for (const tige of tigesCorrespondantes) {
      const key = buildTigeReferenceKey(tige);
      const liste = map.get(key) ?? [];
      liste.push(tige);
      map.set(key, liste);
    }

    return Array.from(map.entries())
  .map(([key, liste]) => {
    const [matiere, diametre] = key.split("|");

    const tousLesMorceaux = tiges.filter(
      (tige) =>
        buildTigeReferenceKey(tige) === key
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
      diametre: normaliserDiametre(liste[0]?.diametre ?? diametre),
      morceaux: tousLesMorceaux,
      morceauxFiltres: liste,
      nombreDisponibles: disponibles.length,
      longueurDisponible,
      longueursDisponibles: disponibles.map((tige) => Number(tige.longueur_disponible || 0)),
      seuil: Object.prototype.hasOwnProperty.call(seuils, key) ? seuils[key] : null,
      statut: calculateStockAlertStatus(
        longueurDisponible,
        Object.prototype.hasOwnProperty.call(seuils, key) ? seuils[key] : null,
      ),
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
  }, [tiges, tigesCorrespondantes, seuils]);

  async function enregistrerSeuil(referenceKey: string, seuil: number | null) {
    setErreur("");
    try {
      const response = await fetch("/api/stock/seuils-longueur", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "tiges_filetees", referenceKey, seuilMm: seuil }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Impossible d’enregistrer le seuil.");
      setSeuils((previous) => {
        const next = { ...previous };
        if (seuil === null) delete next[referenceKey];
        else next[referenceKey] = seuil;
        return next;
      });
      notifyStockAlertsUpdated();
      setMessage(seuil === null ? "Seuil de longueur supprimé." : "Seuil de longueur enregistré.");
      setTimeout(() => setMessage(""), 2500);
      return true;
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "Impossible d’enregistrer le seuil.");
      return false;
    }
  }

  const nombreDisponibles = tiges.filter(
    (tige) => tige.statut === "disponible"
  ).length;

  const indicateurs = useMemo(() => {
    const references = new Map<string, Tige[]>();
    for (const tige of tiges) {
      const key = buildTigeReferenceKey(tige);
      const items = references.get(key) ?? [];
      items.push(tige);
      references.set(key, items);
    }
    const statuts = Array.from(references, ([key, items]) => {
      const longueurTotale = items.reduce((total, tige) => total + (tige.statut === "disponible" ? Number(tige.longueur_disponible || 0) : 0), 0);
      const seuil = Object.prototype.hasOwnProperty.call(seuils, key) ? seuils[key] : null;
      return calculateStockAlertStatus(longueurTotale, seuil);
    });
    return {
      references: statuts.length,
      alertes: statuts.filter((statut) => statut === "a_recommander" || statut === "rupture").length,
      ruptures: statuts.filter((statut) => statut === "rupture").length,
    };
  }, [seuils, tiges]);
  
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
    } catch (error) {
      console.error(error);
      setErreur(messageErreur(error, "Une erreur est survenue."));
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
    } catch (error) {
      console.error(error);
      setErreurUtilisation(messageErreur(error, "Une erreur est survenue."));
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
      notifyStockAlertsUpdated();
    } catch (error) {
      console.error("Erreur suppression tige :", error);
      setErreur(messageErreur(error, "Impossible de supprimer cette tige."));
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

  return (
    <div className="mx-auto max-w-[1500px] px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mb-8">
        <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#172025] text-white shadow-[0_8px_20px_rgba(23,32,37,.15)] sm:h-20 sm:w-20"><Ruler size={30} aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Stock · Atelier</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[#17232b] sm:text-4xl">Tiges filetées</h1>
              <p className="mt-2 text-sm text-slate-500 sm:text-base">Consultez et mettez à jour les longueurs disponibles dans l’atelier.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
            <div className="min-w-[132px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"><Package size={20} className="mx-auto text-slate-600" /><p className="mt-1 text-2xl font-black text-[#17232b]">{indicateurs.references}</p><p className="text-xs font-medium text-slate-500">références</p></div>
            <div className="min-w-[132px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center"><Ruler size={20} className="mx-auto text-slate-600" /><p className="mt-1 text-2xl font-black text-[#17232b]">{nombreDisponibles}</p><p className="text-xs font-medium text-slate-500">morceau{nombreDisponibles > 1 ? "x" : ""} en stock</p></div>
            <div className={`min-w-[132px] rounded-xl border px-4 py-3 text-center ${indicateurs.ruptures > 0 ? "border-red-200 bg-red-50" : indicateurs.alertes > 0 ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
              {indicateurs.ruptures > 0 ? <AlertTriangle size={20} className="mx-auto text-red-600" /> : <CircleAlert size={20} className={`mx-auto ${indicateurs.alertes > 0 ? "text-[#F95516]" : "text-slate-500"}`} />}
              <p className={`mt-1 text-2xl font-black ${indicateurs.ruptures > 0 ? "text-red-700" : indicateurs.alertes > 0 ? "text-[#c43f10]" : "text-[#17232b]"}`}>{indicateurs.alertes}</p>
              <p className="text-xs font-medium text-slate-500">alerte{indicateurs.alertes > 1 ? "s" : ""}</p>
            </div>
            <button type="button" onClick={ouvrirReception} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F95516] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(249,85,22,.20)] transition hover:-translate-y-0.5 hover:bg-[#e04d13] focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"><Plus size={20} /> Réceptionner une tige</button>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h2 className="text-xl font-bold text-[#2F3437]">Tiges filetées en stock</h2>
            <p className="mt-1 text-sm text-slate-500">Recherchez, filtrez et consultez les longueurs disponibles.</p>
          </div>

          <div className={`rounded-xl px-4 py-2 text-sm font-semibold ${indicateurs.ruptures > 0 ? "bg-red-50 text-red-700" : indicateurs.alertes > 0 ? "bg-orange-50 text-[#F95516]" : "bg-slate-100 text-slate-600"}`}>
            {indicateurs.references} référence{indicateurs.references > 1 ? "s" : ""} · {nombreDisponibles} morceau{nombreDisponibles > 1 ? "x" : ""} · {indicateurs.alertes} alerte{indicateurs.alertes > 1 ? "s" : ""}
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
            <table className="min-w-[1120px] w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-sm text-slate-500">
                  <th className="w-10 px-4 py-4"></th>
                  <th className="px-4 py-4 text-left">Matière</th>
                  <th className="px-4 py-4 text-left">Diamètre</th>
                  <th className="px-4 py-4 text-left">Stock</th>
                  <th className="px-4 py-4 text-left">Longueur totale disponible</th>
                  <th className="px-4 py-4 text-left">Longueurs disponibles</th>
                  <th className="px-4 py-4 text-left">Seuil</th>
                  <th className="px-4 py-4 text-left">Statut</th>
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
                    onSaveThreshold={enregistrerSeuil}
                    onDetail={ouvrirDetail}
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
                  <p className="mt-1 text-sm text-slate-500">Saisissez directement la longueur qu’il restera.</p>
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
                  Valider l’utilisation
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
