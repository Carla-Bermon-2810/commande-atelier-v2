"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Settings,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Insert = {
  id: number;
  reference: string;
  matiere: string;
  dimension: string;
  quantite: number;
  seuilMinimum: number;
};

const insertsInitiaux = [
  { reference: "ACPC", matiere: "Acier", dimension: "M4", quantite: 250 },
  { reference: "ACPC", matiere: "Acier", dimension: "M8", quantite: 3 },

  { reference: "ACRC", matiere: "Acier", dimension: "M3", quantite: 500 },
  { reference: "ACRC", matiere: "Acier", dimension: "M4", quantite: 500 },
  { reference: "ACRC", matiere: "Acier", dimension: "M5", quantite: 250 },
  { reference: "ACRC", matiere: "Acier", dimension: "M6", quantite: 750 },
  { reference: "ACRC", matiere: "Acier", dimension: "M8", quantite: 200 },

  { reference: "ACRSH", matiere: "Acier", dimension: "M3", quantite: 500 },
  { reference: "ACRSH", matiere: "Acier", dimension: "M5", quantite: 500 },

  { reference: "INPC", matiere: "Inox", dimension: "M5", quantite: 250 },

  { reference: "INFC", matiere: "Inox", dimension: "M3", quantite: 20 },

  { reference: "INRC", matiere: "Inox", dimension: "M3", quantite: 250 },
  { reference: "INRC", matiere: "Inox", dimension: "M4", quantite: 500 },
  { reference: "INRC", matiere: "Inox", dimension: "M5", quantite: 500 },
  { reference: "INRC", matiere: "Inox", dimension: "M8", quantite: 100 },
];

const dimensions = ["M3", "M4", "M5", "M6", "M8", "M10"];
const matieres = ["Acier", "Inox"];

export default function StockInserts() {
  const [inserts, setInserts] = useState<Insert[]>([]);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [dimensionFiltre, setDimensionFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "sortie" | "ajustement" | "ajouter" | null
  >(null);

  const [insertSelectionne, setInsertSelectionne] =
    useState<Insert | null>(null);

  const [quantite, setQuantite] = useState("");

  const [nouvelleReference, setNouvelleReference] = useState("");
  const [nouvelleMatiere, setNouvelleMatiere] = useState("");
  const [nouvelleDimension, setNouvelleDimension] = useState("");
  const [nouveauSeuil, setNouveauSeuil] = useState("50");

  const [nouvellesPiecesParBoite, setNouvellesPiecesParBoite] =
    useState("200");

  const [nouvellesBoitesPleines, setNouvellesBoitesPleines] =
    useState("1");

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerInserts();
  }, []);

  async function chargerInserts() {
    setChargement(true);
    setErreur("");

    const { data, error } = await supabase
      .from("stock_inserts")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erreur chargement stock inserts :", error);
      setErreur(error.message);
      setChargement(false);
      return;
    }

    const lignes: Insert[] = (data ?? []).map((item) => ({
      id: item.id,
      reference: item.reference,
      matiere: item.matiere,
      dimension: item.dimension,
      quantite: item.quantite,
      seuilMinimum: item.seuil_minimum,
    }));

    setInserts(lignes);
    setChargement(false);
  }

  function getStatut(item: Insert) {
    if (item.quantite === 0) return "rupture";

    if (item.quantite <= item.seuilMinimum) {
      return "recommander";
    }

    return "ok";
  }

  function getPourcentage(item: Insert) {
    const maximum = Math.max(item.seuilMinimum * 4, 100);

    return Math.min(
      100,
      Math.round((item.quantite / maximum) * 100)
    );
  }

  const insertsFiltres = useMemo(() => {
    return inserts.filter((item) => {
      const rechercheLower = recherche.toLowerCase();

      const rechercheOK =
        !recherche ||
        item.reference.toLowerCase().includes(rechercheLower) ||
        item.matiere.toLowerCase().includes(rechercheLower) ||
        item.dimension.toLowerCase().includes(rechercheLower);

      const matiereOK =
        matiereFiltre === "toutes" ||
        item.matiere === matiereFiltre;

      const dimensionOK =
        dimensionFiltre === "toutes" ||
        item.dimension === dimensionFiltre;

      const statutOK =
        statutFiltre === "tous" ||
        getStatut(item) === statutFiltre;

      return (
        rechercheOK &&
        matiereOK &&
        dimensionOK &&
        statutOK
      );
    });
  }, [
    inserts,
    recherche,
    matiereFiltre,
    dimensionFiltre,
    statutFiltre,
  ]);

  const nombreOK = inserts.filter(
    (item) => getStatut(item) === "ok"
  ).length;

  const nombreRecommander = inserts.filter(
    (item) => getStatut(item) === "recommander"
  ).length;

  const nombreRupture = inserts.filter(
    (item) => getStatut(item) === "rupture"
  ).length;

  function fermerModal() {
    setModal(null);
    setInsertSelectionne(null);
    setQuantite("");
  }

  function ouvrirSortie(item: Insert) {
    setInsertSelectionne(item);
    setQuantite("");
    setModal("sortie");
  }

  function ouvrirAjustement(item: Insert) {
    setInsertSelectionne(item);
    setQuantite(String(item.quantite));
    setModal("ajustement");
  }

  async function supprimerInsert(item: Insert) {
    const confirme = window.confirm(
      `Supprimer ${item.reference} du stock ?\n\nCette action supprimera définitivement cette référence.`
    );

    if (!confirme) return;

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_inserts")
        .delete()
        .eq("id", item.id);

      if (error) {
        throw new Error(error.message);
      }

      setInserts((anciens) =>
        anciens.filter((insert) => insert.id !== item.id)
      );
    } catch (error: any) {
      console.error("Erreur suppression insert :", error);

      setErreur(
        error?.message ||
          "Impossible de supprimer cette référence."
      );
    } finally {
      setChargement(false);
    }
  }

  async function sortirStock() {
    if (!insertSelectionne) return;

    const qte = Number(quantite);

    if (!qte || qte <= 0 || !Number.isInteger(qte)) {
      alert("Indique une quantité entière supérieure à 0.");
      return;
    }

    if (qte > insertSelectionne.quantite) {
      alert(
        `Stock insuffisant : ${insertSelectionne.quantite.toLocaleString(
          "fr-FR"
        )} pièce(s) disponible(s).`
      );
      return;
    }

    const nouveauStock =
      insertSelectionne.quantite - qte;

    setChargement(true);

    try {
      const { error } = await supabase
        .from("stock_inserts")
        .update({
          quantite: nouveauStock,
        })
        .eq("id", insertSelectionne.id);

      if (error) {
        alert(
          "Impossible d'enregistrer la sortie : " +
            error.message
        );
        return;
      }

      await chargerInserts();
      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  async function ajusterStock() {
    if (!insertSelectionne) return;

    const nouveauStock = Number(quantite);

    if (
      Number.isNaN(nouveauStock) ||
      nouveauStock < 0 ||
      !Number.isInteger(nouveauStock)
    ) {
      alert("Indique une quantité entière valide.");
      return;
    }

    setChargement(true);

    try {
      const { error } = await supabase
        .from("stock_inserts")
        .update({
          quantite: nouveauStock,
        })
        .eq("id", insertSelectionne.id);

      if (error) {
        alert(
          "Impossible d'ajuster le stock : " +
            error.message
        );
        return;
      }

      await chargerInserts();
      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  async function creerReference() {
    if (!nouvelleReference.trim()) {
      alert("La référence est obligatoire.");
      return;
    }

    if (!nouvelleMatiere || !nouvelleDimension) {
      alert(
        "La matière et la dimension sont obligatoires."
      );
      return;
    }

    const piecesParBoite = Number(
      nouvellesPiecesParBoite
    );

    const boitesPleines = Number(
      nouvellesBoitesPleines
    );

    const seuil = Number(nouveauSeuil);

    if (
      piecesParBoite <= 0 ||
      !Number.isInteger(piecesParBoite)
    ) {
      alert(
        "Le nombre de pièces par boîte doit être valide."
      );
      return;
    }

    if (
      boitesPleines < 0 ||
      !Number.isInteger(boitesPleines)
    ) {
      alert(
        "Le nombre de boîtes pleines doit être valide."
      );
      return;
    }

    if (
      Number.isNaN(seuil) ||
      seuil < 0 ||
      !Number.isInteger(seuil)
    ) {
      alert("Le stock minimum doit être valide.");
      return;
    }

    const quantiteInitiale =
      piecesParBoite * boitesPleines;

    setChargement(true);

    try {
      const {
        data: nouvelInsert,
        error,
      } = await supabase
        .from("stock_inserts")
        .insert({
          reference: nouvelleReference.trim(),
          designation: nouvelleReference.trim(),
          matiere: nouvelleMatiere,
          dimension: nouvelleDimension,
          quantite: quantiteInitiale,
          seuil_minimum: seuil,
        })
        .select()
        .single();

      if (error) {
        alert(
          "Impossible de créer la référence : " +
            error.message
        );
        return;
      }

      if (nouvelInsert) {
        setInserts((anciens) => [
          ...anciens,
          {
            id: nouvelInsert.id,
            reference: nouvelInsert.reference,
            matiere: nouvelInsert.matiere,
            dimension: nouvelInsert.dimension,
            quantite: nouvelInsert.quantite,
            seuilMinimum: nouvelInsert.seuil_minimum,
          },
        ]);
      }

      setNouvelleReference("");
      setNouvelleMatiere("");
      setNouvelleDimension("");
      setNouvellesPiecesParBoite("200");
      setNouvellesBoitesPleines("1");
      setNouveauSeuil("50");

      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  async function initialiserDonnees() {
    if (inserts.length > 0) {
      alert(
        "Le stock Inserts contient déjà des données."
      );
      return;
    }

    if (
      !confirm(
        "Importer les références et quantités de ton tableau initial ?"
      )
    ) {
      return;
    }

    setChargement(true);

    try {
      for (const item of insertsInitiaux) {
        const { error } = await supabase
          .from("stock_inserts")
          .insert({
            reference: item.reference,
            designation: `Insert ${item.reference} ${item.dimension}`,
            matiere: item.matiere,
            dimension: item.dimension,
            quantite: item.quantite,
            seuil_minimum: 50,
          });

        if (error) {
          console.error(
            "Erreur insertion donnée initiale :",
            item,
            error
          );
        }
      }

      await chargerInserts();
    } finally {
      setChargement(false);
    }
  }

  function renderStatut(item: Insert) {
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
              Stock inserts
            </h1>
          </div>

          <p className="mt-2 text-slate-500">
            Gestion des inserts disponibles dans
            l&apos;atelier
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModal("ajouter")}
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

      {/* AUCUNE RÉFÉRENCE */}
      {inserts.length === 0 && !chargement && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-[#2F3437]">
                Aucune référence dans le stock
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Tu peux importer les références
                et quantités de ton tableau initial.
              </p>
            </div>

            <button
              type="button"
              onClick={initialiserDonnees}
              className="shrink-0 rounded-xl bg-[#F95516] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e04d13]"
            >
              Importer les données
            </button>
          </div>
        </div>
      )}

      {/* STOCK */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* FILTRES / STATISTIQUES */}
        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">
                Inserts en stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des références et quantités
                disponibles.
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
              {insertsFiltres.length} /{" "}
              {inserts.length} référence(s)
            </div>
          </div>

          {/* STATISTIQUES */}
          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <button
              type="button"
              onClick={() => setStatutFiltre("ok")}
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
                setStatutFiltre("recommander")
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
                setStatutFiltre("rupture")
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
          <div className="mt-5 grid grid-cols-4 gap-3">
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une référence..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F95516]"
            />

            <select
              value={matiereFiltre}
              onChange={(e) => setMatiereFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="toutes">Toutes les matières</option>

              {matieres.map((matiere) => (
                <option key={matiere} value={matiere}>
                  {matiere}
                </option>
              ))}
            </select>

            <select
              value={dimensionFiltre}
              onChange={(e) => setDimensionFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="toutes">Toutes les dimensions</option>

              {dimensions.map((dimension) => (
                <option key={dimension} value={dimension}>
                  {dimension}
                </option>
              ))}
            </select>

            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="ok">Stock OK</option>
              <option value="recommander">À recommander</option>
              <option value="rupture">Rupture</option>
            </select>
          </div>

            {/* RESET */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  setMatiereFiltre("toutes");
                  setDimensionFiltre("toutes");
                  setStatutFiltre("tous");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Réinitialiser les filtres
              </button>
            </div>
            </div>

        {/* LISTE DES INSERTS */}
        <div className="divide-y divide-slate-100">

          {insertsFiltres.map((item) => {
            const pourcentage =
              getPourcentage(item);

            return (
              <div
                key={item.id}
                className="px-6 py-6 transition hover:bg-slate-50/60"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                  {/* INFORMATIONS */}
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-[#2F3437]">
                        {item.reference}
                      </h3>

                      {renderStatut(item)}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">

                      <span>
                        Matière :{" "}
                        <strong>
                          {item.matiere}
                        </strong>
                      </span>

                      <span>
                        Dimension :{" "}
                        <strong>
                          {item.dimension}
                        </strong>
                      </span>
                    </div>

                    {/* STOCK */}
                    <div className="mt-5 max-w-2xl">

                      <div className="flex items-end justify-between">

                        <div>
                          <div className="text-sm font-semibold text-slate-600">
                            Stock
                          </div>

                          <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                            {item.quantite.toLocaleString(
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

                      <div className="mt-3 text-sm text-slate-500">
                        Minimum :{" "}
                        <strong className="text-slate-700">
                          {item.seuilMinimum} pièces
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
                        ouvrirSortie(item)
                      }
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Minus size={17} />
                      Sortie
                    </button>

                    {/* AJUSTER */}
                    <button
                      type="button"
                      onClick={() =>
                        ouvrirAjustement(item)
                      }
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings size={17} />
                      Ajuster
                    </button>

                    {/* POUBELLE */}
                    <button
                      type="button"
                      onClick={() =>
                        supprimerInsert(item)
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

                {insertSelectionne && (
                  <p className="mt-1 text-sm text-slate-500">
                    {insertSelectionne.reference}
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

            {/* AJOUTER */}
            {modal === "ajouter" && (
              <div className="space-y-5 px-6 py-6">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Référence *
                  </label>

                  <input
                    value={nouvelleReference}
                    onChange={(e) =>
                      setNouvelleReference(
                        e.target.value
                      )
                    }
                    placeholder="Ex. ACRC"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Matière
                    </label>

                    <select
                      value={nouvelleMatiere}
                      onChange={(e) =>
                        setNouvelleMatiere(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">
                        Non renseignée
                      </option>

                      {matieres.map((matiere) => (
                        <option
                          key={matiere}
                          value={matiere}
                        >
                          {matiere}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Dimension
                    </label>

                    <select
                      value={nouvelleDimension}
                      onChange={(e) =>
                        setNouvelleDimension(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">
                        Dimension
                      </option>

                      {dimensions.map((dimension) => (
                        <option
                          key={dimension}
                          value={dimension}
                        >
                          {dimension}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Pièces / boîte
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        nouvellesPiecesParBoite
                      }
                      onChange={(e) =>
                        setNouvellesPiecesParBoite(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Boîtes pleines
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        nouvellesBoitesPleines
                      }
                      onChange={(e) =>
                        setNouvellesBoitesPleines(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Seuil de stock
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Alerte lorsque le stock passe
                    sous ce niveau.
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-800">
                  Quantité totale :{" "}
                  <strong>
                    {(
                      Number(
                        nouvellesPiecesParBoite || 0
                      ) *
                      Number(
                        nouvellesBoitesPleines || 0
                      )
                    ).toLocaleString("fr-FR")}{" "}
                    pièce(s)
                  </strong>
                </div>

                <div className="flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={fermerModal}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    onClick={creerReference}
                    className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Créer
                  </button>

                </div>
              </div>
            )}

            {/* SORTIE / AJUSTEMENT */}
            {(modal === "sortie" ||
              modal === "ajustement") &&
              insertSelectionne && (
                <div className="space-y-5 px-6 py-6">

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">
                      Stock actuel
                    </div>

                    <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                      {insertSelectionne.quantite.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      pièces
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {modal === "ajustement"
                        ? "Nouveau stock réel"
                        : "Quantité"}
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
                      placeholder="Ex. 250"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#F95516]"
                    />
                  </div>

                  <div className="flex justify-end gap-3">

                    <button
                      type="button"
                      onClick={fermerModal}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
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

          </div>
        </div>
      )}
    </div>
  );
}
