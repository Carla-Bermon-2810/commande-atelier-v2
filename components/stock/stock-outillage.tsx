"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Settings2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { notifyStockAlertsUpdated } from "@/lib/stock-alerts-client";

type TypeOutillage = "forets" | "fraises" | "tarauds";

type Outil = {
  id: number;
  dimension: string;
  designation?: string | null;
  reference?: string | null;
  quantite: number;
  seuil_minimum: number;
};

const config = {
  forets: {
    titre: "Forets",
    description: "Gestion des forets disponibles dans l'atelier",
    table: "stock_forets",
    mouvementTable: "stock_mouvements_forets",
    mouvementId: "foret_id",
  },
  fraises: {
    titre: "Fraises",
    description: "Gestion des fraises disponibles dans l'atelier",
    table: "stock_fraises",
    mouvementTable: "stock_mouvements_fraises",
    mouvementId: "fraise_id",
  },
  tarauds: {
    titre: "Tarauds",
    description: "Gestion des tarauds disponibles dans l'atelier",
    table: "stock_tarauds",
    mouvementTable: "stock_mouvements_tarauds",
    mouvementId: "taraud_id",
  },
} as const;

function messageErreur(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Impossible d’effectuer cette action.";
}

export default function StockOutillage({
  type,
}: {
  type: TypeOutillage;
}) {
  const currentConfig = config[type];

  const [outils, setOutils] = useState<Outil[]>([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "ajouter" | "sortie" | "ajustement" | null
  >(null);

  const [outilSelectionne, setOutilSelectionne] =
    useState<Outil | null>(null);

  const [dimension, setDimension] = useState("");
  const [designation, setDesignation] = useState("");
  const [reference, setReference] = useState("");
  const [quantite, setQuantite] = useState("");
  const [seuilMinimum, setSeuilMinimum] = useState("2");

  const chargerStock = useCallback(async () => {
    setChargement(true);
    setErreur("");

    const { data, error } = await supabase
      .from(currentConfig.table)
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erreur chargement stock :", error);
      setErreur(error.message);
      setChargement(false);
      return;
    }

    setOutils((data as Outil[]) || []);
    notifyStockAlertsUpdated();
    setChargement(false);
  }, [currentConfig.table]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void chargerStock();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [chargerStock]);

  function getStatut(outil: Outil) {
    if (outil.quantite === 0) {
      return "rupture";
    }

    if (outil.quantite <= outil.seuil_minimum) {
      return "recommander";
    }

    return "ok";
  }

  function getPourcentage(outil: Outil) {
    if (outil.seuil_minimum <= 0) {
      return outil.quantite > 0 ? 100 : 0;
    }

    return Math.min(
      100,
      Math.round(
        (outil.quantite / outil.seuil_minimum) * 100
      )
    );
  }

  const outilsFiltres = useMemo(() => {
    return outils.filter((outil) => {
      const texte = `
        ${outil.dimension}
        ${outil.designation || ""}
        ${outil.reference || ""}
      `.toLowerCase();

      const rechercheOK =
        !recherche ||
        texte.includes(recherche.toLowerCase());

      const statutOK =
        statutFiltre === "tous" ||
        getStatut(outil) === statutFiltre;

      return rechercheOK && statutOK;
    });
  }, [outils, recherche, statutFiltre]);

  const nombreOK = outils.filter(
    (outil) => getStatut(outil) === "ok"
  ).length;

  const nombreRecommander = outils.filter(
    (outil) => getStatut(outil) === "recommander"
  ).length;

  const nombreRupture = outils.filter(
    (outil) => getStatut(outil) === "rupture"
  ).length;

  function fermerModal() {
    setModal(null);
    setOutilSelectionne(null);
    setDimension("");
    setDesignation("");
    setReference("");
    setQuantite("");
    setSeuilMinimum("2");
    setErreur("");
  }

  function ouvrirAjout() {
    setErreur("");
    setModal("ajouter");
  }

  function ouvrirSortie(outil: Outil) {
    setOutilSelectionne(outil);
    setQuantite("");
    setErreur("");
    setModal("sortie");
  }

  function ouvrirAjustement(outil: Outil) {
    setOutilSelectionne(outil);
    setQuantite(String(outil.quantite));
    setErreur("");
    setModal("ajustement");
  }

  async function supprimerOutil(outil: Outil) {
    const nom = nomOutil(outil);

    const confirme = window.confirm(
      `Supprimer ${nom} du stock ?\n\nCette action supprimera définitivement cette référence.`
    );

    if (!confirme) return;

    setChargement(true);
    setErreur("");

    try {
      /*
       * On supprime d'abord les mouvements associés.
       * Cela évite une erreur si la table mouvements
       * possède une clé étrangère vers le stock.
       */
      const { error: mouvementsError } = await supabase
        .from(currentConfig.mouvementTable)
        .delete()
        .eq(currentConfig.mouvementId, outil.id);

      if (mouvementsError) {
        console.error(
          "Erreur suppression mouvements :",
          mouvementsError
        );
      }

      const { error } = await supabase
        .from(currentConfig.table)
        .delete()
        .eq("id", outil.id);

      if (error) {
        throw new Error(error.message);
      }

      setOutils((anciens) =>
        anciens.filter((item) => item.id !== outil.id)
      );
    } catch (error: unknown) {
      console.error(
        "Erreur suppression outil :",
        error
      );

      setErreur(
        messageErreur(error)
      );
    } finally {
      setChargement(false);
    }
  }

  async function ajouterReference() {
    setErreur("");

    if (!dimension.trim()) {
      setErreur("La dimension est obligatoire.");
      return;
    }

    if (type === "fraises" && !designation.trim()) {
      setErreur("La désignation est obligatoire.");
      return;
    }

    const seuil = Number(seuilMinimum);

    if (
      !Number.isInteger(seuil) ||
      seuil < 0
    ) {
      setErreur(
        "Le stock minimum doit être un nombre entier."
      );
      return;
    }

    const donnees: Record<string, unknown> = {
      dimension: dimension.trim(),
      quantite: 0,
      seuil_minimum: seuil,
    };

    if (type === "fraises") {
      donnees.designation = designation.trim();
    }

    if (type === "tarauds") {
      donnees.reference =
        reference.trim() || null;
    }

    setChargement(true);

    try {
      const { data, error } = await supabase
        .from(currentConfig.table)
        .insert(donnees)
        .select()
        .single();

      if (error) {
        setErreur(error.message);
        return;
      }

      if (data) {
        setOutils((anciens) => [
          ...anciens,
          data as Outil,
        ]);
      }

      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  async function sortirStock() {
    if (!outilSelectionne) return;

    const qte = Number(quantite);

    if (
      !Number.isInteger(qte) ||
      qte <= 0
    ) {
      setErreur(
        "Indique une quantité entière supérieure à 0."
      );
      return;
    }

    if (
      qte > outilSelectionne.quantite
    ) {
      setErreur(
        `Stock insuffisant : ${outilSelectionne.quantite.toLocaleString(
          "fr-FR"
        )} pièce(s) disponible(s).`
      );
      return;
    }

    const nouveauStock =
      outilSelectionne.quantite - qte;

    setChargement(true);

    try {
      const { error } = await supabase
        .from(currentConfig.table)
        .update({
          quantite: nouveauStock,
        })
        .eq("id", outilSelectionne.id);

      if (error) {
        setErreur(
          "Impossible d'enregistrer la sortie : " +
            error.message
        );
        return;
      }

      await chargerStock();
      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  async function ajusterStock() {
    if (!outilSelectionne) return;

    const nouveauStock = Number(quantite);

    if (
      !Number.isInteger(nouveauStock) ||
      nouveauStock < 0
    ) {
      setErreur(
        "Indique un stock entier valide."
      );
      return;
    }

    setChargement(true);

    try {
      const { error } = await supabase
        .from(currentConfig.table)
        .update({
          quantite: nouveauStock,
        })
        .eq("id", outilSelectionne.id);

      if (error) {
        setErreur(
          "Impossible d'ajuster le stock : " +
            error.message
        );
        return;
      }

      await chargerStock();
      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  function nomOutil(outil: Outil) {
    if (type === "forets") {
      return `Foret ${outil.dimension}`;
    }

    if (type === "fraises") {
      return (
        outil.designation ||
        `Fraise ${outil.dimension}`
      );
    }

    return `Taraud ${outil.dimension}`;
  }

  function renderStatut(outil: Outil) {
    const statut = getStatut(outil);

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

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:p-6 lg:p-8">

      {/* EN-TÊTE */}
      <section className="mb-6 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:mb-8 sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#17232b] text-white shadow-sm">
            <Package size={27} className="text-[#F95516]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">
              Stock · Outillage
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#17232b] sm:text-4xl">
              {currentConfig.titre}
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              {currentConfig.description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={ouvrirAjout}
          className="flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13] lg:w-auto"
        >
          <Plus size={20} />
          Ajouter une référence
        </button>
      </section>

      {/* ERREUR */}
      {erreur && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Erreur :</strong> {erreur}
        </div>
      )}

      {/* STOCK */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* FILTRES / STATISTIQUES */}
        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">
                {type === "forets"
                  ? "Forets en stock"
                  : type === "fraises"
                    ? "Fraises en stock"
                    : "Tarauds en stock"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des références et quantités
                disponibles.
              </p>
            </div>

            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {outilsFiltres.length} /{" "}
              {outils.length} référence(s)
            </div>
          </div>

          {/* STATISTIQUES */}
          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <button
              type="button"
              onClick={() =>
                setStatutFiltre(
                  statutFiltre === "ok"
                    ? "tous"
                    : "ok"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                nombreOK > 0
                  ? "border-green-100 bg-green-50/60 hover:border-green-200"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className={`flex items-center gap-2 text-sm font-semibold ${nombreOK > 0 ? "text-green-700" : "text-slate-600"}`}>
                <CheckCircle2 size={18} />
                Stock OK
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {nombreOK}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatutFiltre(
                  statutFiltre === "recommander"
                    ? "tous"
                    : "recommander"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                nombreRecommander > 0
                  ? "border-orange-100 bg-orange-50/70 hover:border-orange-200"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className={`flex items-center gap-2 text-sm font-semibold ${nombreRecommander > 0 ? "text-orange-700" : "text-slate-600"}`}>
                <AlertTriangle size={18} />
                À recommander
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {nombreRecommander}
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setStatutFiltre(
                  statutFiltre === "rupture"
                    ? "tous"
                    : "rupture"
                )
              }
              className={`rounded-2xl border p-4 text-left transition ${
                nombreRupture > 0
                  ? "border-red-100 bg-red-50/70 hover:border-red-200"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className={`flex items-center gap-2 text-sm font-semibold ${nombreRupture > 0 ? "text-red-700" : "text-slate-600"}`}>
                <XCircle size={18} />
                Rupture
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {nombreRupture}
              </div>
            </button>

          </div>

          {/* FILTRES */}
          <div className="mt-5 grid grid-cols-2 gap-3">

            <input
              type="text"
              value={recherche}
              onChange={(e) =>
                setRecherche(e.target.value)
              }
              placeholder={
                type === "fraises"
                  ? "Rechercher une désignation..."
                  : "Rechercher une référence..."
              }
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F95516]"
            />

            <select
              value={statutFiltre}
              onChange={(e) =>
                setStatutFiltre(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="tous">
                Tous les statuts
              </option>

              <option value="ok">
                Stock OK
              </option>

              <option value="recommander">
                À recommander
              </option>

              <option value="rupture">
                Rupture
              </option>
            </select>

          </div>

          {/* RESET */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setStatutFiltre("tous");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          </div>

        </div>

        {/* LISTE */}
        {chargement ? (
          <div className="px-6 py-16 text-center text-slate-500">
            Chargement du stock...
          </div>
        ) : outilsFiltres.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            Aucun outil ne correspond aux filtres.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {outilsFiltres.map((outil) => {
              const pourcentage =
                getPourcentage(outil);
              const statut = getStatut(outil);
              const fondLigne =
                statut === "rupture"
                  ? "bg-red-50/55"
                  : statut === "recommander"
                    ? "bg-orange-50/55"
                    : "bg-white";
              const couleurProgression =
                statut === "rupture"
                  ? "bg-red-500"
                  : statut === "recommander"
                    ? "bg-[#F95516]"
                    : "bg-[#17232b]";
              const ecartSeuil =
                outil.quantite - outil.seuil_minimum;

              return (
                <div
                  key={outil.id}
                  className={`px-5 py-5 transition sm:px-6 sm:py-6 ${fondLigne} hover:brightness-[0.985]`}
                >

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                    {/* INFORMATIONS */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2.5">

                        <h3 className="text-lg font-bold text-[#2F3437]">
                          {nomOutil(outil)}
                        </h3>

                        {renderStatut(outil)}

                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                        <span>
                          Dimension :{" "}
                          <strong className="font-semibold text-slate-700">
                            {outil.dimension}
                          </strong>
                        </span>
                        {outil.reference && (
                          <span>
                            Référence :{" "}
                            <strong className="font-semibold text-slate-700">
                              {outil.reference}
                            </strong>
                          </span>
                        )}
                        {type === "fraises" && outil.designation && (
                          <span>
                            Désignation :{" "}
                            <strong className="font-semibold text-slate-700">
                              {outil.designation}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* STOCK */}
                      <div className="mt-5 w-full max-w-none rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">

                        <div className="flex items-end justify-between">

                          <div>
                            <div className="text-sm font-semibold text-slate-600">
                              Stock disponible
                            </div>

                            <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                              {outil.quantite.toLocaleString(
                                "fr-FR"
                              )}{" "}
                              pièces
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-slate-500">
                              Couverture du seuil
                            </div>

                            <div className="text-lg font-bold text-[#F95516]">
                              {pourcentage} %
                            </div>
                          </div>

                        </div>

                        {/* BARRE */}
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${couleurProgression}`}
                            style={{
                              width: `${pourcentage}%`,
                            }}
                          />
                        </div>

                        {/* MINIMUM */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span>
                            Seuil minimum :{" "}
                            <strong className="text-slate-700">
                              {outil.seuil_minimum}{" "}
                              pièce(s)
                            </strong>
                          </span>
                          {outil.seuil_minimum > 0 ? (
                            <span>
                              Écart au seuil :{" "}
                              <strong
                                className={
                                  ecartSeuil >= 0
                                    ? "text-emerald-700"
                                    : "text-[#F95516]"
                                }
                              >
                                {ecartSeuil >= 0 ? "+" : ""}
                                {ecartSeuil.toLocaleString("fr-FR")} pièce(s)
                              </strong>
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Seuil non défini
                            </span>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 xl:flex-nowrap">

                      {/* SORTIE */}
                      <button
                        type="button"
                        onClick={() =>
                          ouvrirSortie(outil)
                        }
                        disabled={
                          outil.quantite === 0
                        }
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={17} />
                        Sortie
                      </button>

                      {/* AJUSTER */}
                      <button
                        type="button"
                        onClick={() =>
                          ouvrirAjustement(outil)
                        }
                        className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Settings2 size={17} />
                        Ajuster
                      </button>

                      {/* POUBELLE */}
                      <button
                        type="button"
                        onClick={() =>
                          supprimerOutil(outil)
                        }
                        title="Supprimer la référence"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={17} />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* MODALE */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#2F3437]">

                  {modal === "ajouter" &&
                    "Ajouter une référence"}

                  {modal === "sortie" &&
                    "Sortie de stock"}

                  {modal === "ajustement" &&
                    "Ajuster le stock"}

                </h2>

                {outilSelectionne && (
                  <p className="mt-1 text-sm text-slate-500">
                    {nomOutil(outilSelectionne)}
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

            {/* CONTENU */}
            <div className="px-6 py-6">

              {erreur && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erreur}
                </div>
              )}

              {/* AJOUT */}
              {modal === "ajouter" && (
                <div className="space-y-5">

                  {/* DIMENSION */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Dimension *
                    </label>

                    <input
                      value={dimension}
                      onChange={(e) =>
                        setDimension(
                          e.target.value
                        )
                      }
                      placeholder={
                        type === "forets"
                          ? "Ex. D6"
                          : type === "fraises"
                            ? "Ex. D25"
                            : "Ex. M8"
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  {/* DESIGNATION FRAISES */}
                  {type === "fraises" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Désignation *
                      </label>

                      <input
                        value={designation}
                        onChange={(e) =>
                          setDesignation(
                            e.target.value
                          )
                        }
                        placeholder="Ex. FRAISE A CHANFREINER"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  )}

                  {/* REFERENCE TARAUDS */}
                  {type === "tarauds" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Référence
                      </label>

                      <input
                        value={reference}
                        onChange={(e) =>
                          setReference(
                            e.target.value
                          )
                        }
                        placeholder="Ex. BLISTER"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  )}

                  {/* SEUIL */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Stock minimum
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={seuilMinimum}
                      onChange={(e) =>
                        setSeuilMinimum(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Alerte lorsque le stock passe
                      sous ce niveau.
                    </p>
                  </div>

                </div>
              )}

              {/* SORTIE */}
              {modal === "sortie" &&
                outilSelectionne && (
                  <div className="space-y-5">

                    <div className="rounded-2xl bg-slate-50 p-4">

                      <div className="text-sm text-slate-500">
                        Stock actuel
                      </div>

                      <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                        {outilSelectionne.quantite.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        pièces
                      </div>

                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Quantité *
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={quantite}
                        onChange={(e) =>
                          setQuantite(
                            e.target.value
                          )
                        }
                        autoFocus
                        placeholder="Ex. 10"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#F95516]"
                      />
                    </div>

                  </div>
                )}

              {/* AJUSTEMENT */}
              {modal === "ajustement" &&
                outilSelectionne && (
                  <div className="space-y-5">

                    <div className="rounded-2xl bg-slate-50 p-4">

                      <div className="text-sm text-slate-500">
                        Stock actuel
                      </div>

                      <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                        {outilSelectionne.quantite.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        pièces
                      </div>

                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Nouveau stock réel *
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
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#F95516]"
                      />
                    </div>

                  </div>
                )}

            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>

              {modal === "ajouter" && (
                <button
                  type="button"
                  onClick={ajouterReference}
                  className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e04d13]"
                >
                  Ajouter
                </button>
              )}

              {modal === "sortie" && (
                <button
                  type="button"
                  onClick={sortirStock}
                  className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e04d13]"
                >
                  Enregistrer
                </button>
              )}

              {modal === "ajustement" && (
                <button
                  type="button"
                  onClick={ajusterStock}
                  className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white hover:bg-[#e04d13]"
                >
                  Enregistrer
                </button>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
