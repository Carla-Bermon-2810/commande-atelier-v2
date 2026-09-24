"use client";

import { useEffect, useMemo, useState } from "react";
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
    titre: "Stock forets",
    description: "Gestion des forets disponibles dans l'atelier",
    table: "stock_forets",
    mouvementTable: "stock_mouvements_forets",
    mouvementId: "foret_id",
  },
  fraises: {
    titre: "Stock fraises",
    description: "Gestion des fraises disponibles dans l'atelier",
    table: "stock_fraises",
    mouvementTable: "stock_mouvements_fraises",
    mouvementId: "fraise_id",
  },
  tarauds: {
    titre: "Stock tarauds",
    description: "Gestion des tarauds disponibles dans l'atelier",
    table: "stock_tarauds",
    mouvementTable: "stock_mouvements_tarauds",
    mouvementId: "taraud_id",
  },
} as const;

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

  useEffect(() => {
    chargerStock();
  }, [type]);

  async function chargerStock() {
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
    setChargement(false);
  }

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
    const maximum = Math.max(
      outil.seuil_minimum * 4,
      10
    );

    return Math.min(
      100,
      Math.round((outil.quantite / maximum) * 100)
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
    } catch (error: any) {
      console.error(
        "Erreur suppression outil :",
        error
      );

      setErreur(
        error?.message ||
          "Impossible de supprimer cette référence."
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
    <div className="mx-auto max-w-7xl p-8">

      {/* EN-TÊTE */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package
              size={32}
              className="text-[#F95516]"
            />

            <h1 className="text-4xl font-bold text-[#2F3437]">
              {currentConfig.titre}
            </h1>
          </div>

          <p className="mt-2 text-slate-500">
            {currentConfig.description}
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirAjout}
          className="flex items-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13]"
        >
          <Plus size={20} />
          Ajouter une référence
        </button>
      </div>

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

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
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
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-green-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
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
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
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
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-red-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
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

              return (
                <div
                  key={outil.id}
                  className="px-6 py-6 transition hover:bg-slate-50/60"
                >

                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                    {/* INFORMATIONS */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold text-[#2F3437]">
                          {nomOutil(outil)}
                        </h3>

                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {outil.dimension}
                        </span>

                        {type === "tarauds" &&
                          outil.reference && (
                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {outil.reference}
                            </span>
                          )}

                        {renderStatut(outil)}

                      </div>

                      {/* STOCK */}
                      <div className="mt-5 max-w-2xl">

                        <div className="flex items-end justify-between">

                          <div>
                            <div className="text-sm font-semibold text-slate-600">
                              Stock
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
                              Remplissage
                            </div>

                            <div className="text-lg font-bold text-[#F95516]">
                              {pourcentage} %
                            </div>
                          </div>

                        </div>

                        {/* BARRE */}
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#F95516] transition-all"
                            style={{
                              width: `${pourcentage}%`,
                            }}
                          />
                        </div>

                        {/* MINIMUM */}
                        <div className="mt-3 text-sm text-slate-500">
                          Minimum :{" "}
                          <strong className="text-slate-700">
                            {outil.seuil_minimum}{" "}
                            pièce(s)
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* ACTIONS */}
                    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">

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
