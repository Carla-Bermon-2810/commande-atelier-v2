"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Minus,
  Package,
  Plus,
  Settings,
  X,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Insert = {
  id: number;
  reference: string;
  designation: string;
  matiere: string;
  dimension: string;
  quantite: number;
  seuilMinimum: number;
};

type Mouvement = {
  id: number;
  insertId: number;
  type: "reception" | "sortie" | "ajustement";
  quantite: number;
  commentaire: string | null;
  date: string;
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
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [dimensionFiltre, setDimensionFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "reception" | "sortie" | "ajustement" | "historique" | "ajouter" | null
  >(null);

  const [insertSelectionne, setInsertSelectionne] =
    useState<Insert | null>(null);

  const [quantite, setQuantite] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const [nouvelleReference, setNouvelleReference] = useState("");
  const [nouvelleDesignation, setNouvelleDesignation] = useState("");
  const [nouvelleMatiere, setNouvelleMatiere] = useState("");
  const [nouvelleDimension, setNouvelleDimension] = useState("");
  const [nouveauSeuil, setNouveauSeuil] = useState("50");

  const [historique, setHistorique] = useState<Mouvement[]>([]);
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
      designation: item.designation,
      matiere: item.matiere,
      dimension: item.dimension,
      quantite: item.quantite,
      seuilMinimum: item.seuil_minimum,
    }));

    setInserts(lignes);
    setChargement(false);
  }

  const insertsFiltres = useMemo(() => {
    return inserts.filter((item) => {
      const rechercheOK =
        !recherche ||
        item.reference.toLowerCase().includes(recherche.toLowerCase()) ||
        item.designation.toLowerCase().includes(recherche.toLowerCase());

      const matiereOK =
        matiereFiltre === "toutes" ||
        item.matiere === matiereFiltre;

      const dimensionOK =
        dimensionFiltre === "toutes" ||
        item.dimension === dimensionFiltre;

      const statutOK =
        statutFiltre === "tous" ||
        getStatut(item) === statutFiltre;

      return rechercheOK && matiereOK && dimensionOK && statutOK;
    });
  }, [
    inserts,
    recherche,
    matiereFiltre,
    dimensionFiltre,
    statutFiltre,
  ]);

  function getStatut(item: Insert) {
    if (item.quantite === 0) return "rupture";
    if (item.quantite <= item.seuilMinimum) return "recommander";
    return "ok";
  }

  function getPourcentage(item: Insert) {
    const maximum = Math.max(item.seuilMinimum * 4, 100);

    return Math.min(
      100,
      Math.round((item.quantite / maximum) * 100)
    );
  }

  const nombreOK = inserts.filter(
    (item) => getStatut(item) === "ok"
  ).length;

  const nombreRecommander = inserts.filter(
    (item) => getStatut(item) === "recommander"
  ).length;

  const nombreRupture = inserts.filter(
    (item) => getStatut(item) === "rupture"
  ).length;

  const totalPieces = inserts.reduce(
    (total, item) => total + item.quantite,
    0
  );

  function fermerModal() {
    setModal(null);
    setInsertSelectionne(null);
    setQuantite("");
    setCommentaire("");
    setHistorique([]);
  }

  function ouvrirReception(item: Insert) {
    setInsertSelectionne(item);
    setQuantite("");
    setCommentaire("");
    setModal("reception");
  }

  function ouvrirSortie(item: Insert) {
    setInsertSelectionne(item);
    setQuantite("");
    setCommentaire("");
    setModal("sortie");
  }

  function ouvrirAjustement(item: Insert) {
    setInsertSelectionne(item);
    setQuantite(String(item.quantite));
    setCommentaire("");
    setModal("ajustement");
  }

  async function ouvrirHistorique(item: Insert) {
    setInsertSelectionne(item);
    setModal("historique");

    const { data, error } = await supabase
      .from("stock_mouvements_inserts")
      .select("*")
      .eq("insert_id", item.id)
      .order("date_mouvement", { ascending: false });

    if (error) {
      console.error("Erreur historique inserts :", error);
      setHistorique([]);
      return;
    }

    setHistorique(
      (data ?? []).map((mouvement) => ({
        id: mouvement.id,
        insertId: mouvement.insert_id,
        type: mouvement.type_mouvement,
        quantite: mouvement.quantite,
        commentaire: mouvement.commentaire,
        date: new Date(mouvement.date_mouvement).toLocaleString(
          "fr-FR"
        ),
      }))
    );
  }

  async function receptionner() {
    if (!insertSelectionne) return;

    const qte = Number(quantite);

    if (!qte || qte <= 0) {
      alert("Indique une quantité supérieure à 0.");
      return;
    }

    const nouveauStock = insertSelectionne.quantite + qte;

    setChargement(true);

    try {
      const { error: erreurStock } = await supabase
        .from("stock_inserts")
        .update({
          quantite: nouveauStock,
        })
        .eq("id", insertSelectionne.id);

      if (erreurStock) {
        alert(
          "Impossible d'enregistrer la réception : " +
            erreurStock.message
        );
        return;
      }

      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements_inserts")
        .insert({
          insert_id: insertSelectionne.id,
          type_mouvement: "reception",
          quantite: qte,
          commentaire:
            commentaire || "Réception de stock",
        });

      if (erreurMouvement) {
        alert(
          "Le stock a été enregistré mais l'historique a échoué : " +
            erreurMouvement.message
        );
        return;
      }

      await chargerInserts();
      fermerModal();
    } finally {
      setChargement(false);
    }
  }

  async function sortirStock() {
    if (!insertSelectionne) return;

    const qte = Number(quantite);

    if (!qte || qte <= 0) {
      alert("Indique une quantité supérieure à 0.");
      return;
    }

    if (qte > insertSelectionne.quantite) {
      alert(
        `Stock insuffisant : ${insertSelectionne.quantite} pièce(s) disponible(s).`
      );
      return;
    }

    const nouveauStock = insertSelectionne.quantite - qte;

    setChargement(true);

    try {
      const { error: erreurStock } = await supabase
        .from("stock_inserts")
        .update({
          quantite: nouveauStock,
        })
        .eq("id", insertSelectionne.id);

      if (erreurStock) {
        alert(
          "Impossible d'enregistrer la sortie : " +
            erreurStock.message
        );
        return;
      }

      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements_inserts")
        .insert({
          insert_id: insertSelectionne.id,
          type_mouvement: "sortie",
          quantite: qte,
          commentaire:
            commentaire || "Sortie de stock",
        });

      if (erreurMouvement) {
        alert(
          "Le stock a été enregistré mais l'historique a échoué : " +
            erreurMouvement.message
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
      const { error: erreurStock } = await supabase
        .from("stock_inserts")
        .update({
          quantite: nouveauStock,
        })
        .eq("id", insertSelectionne.id);

      if (erreurStock) {
        alert(
          "Impossible d'ajuster le stock : " +
            erreurStock.message
        );
        return;
      }

      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements_inserts")
        .insert({
          insert_id: insertSelectionne.id,
          type_mouvement: "ajustement",
          quantite: nouveauStock,
          commentaire:
            commentaire || "Ajustement du stock",
        });

      if (erreurMouvement) {
        alert(
          "Le stock a été enregistré mais l'historique a échoué : " +
            erreurMouvement.message
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
    if (!nouvelleReference || !nouvelleDesignation) {
      alert("La référence et la désignation sont obligatoires.");
      return;
    }

    if (!nouvelleMatiere || !nouvelleDimension) {
      alert("La matière et la dimension sont obligatoires.");
      return;
    }

    const seuil = Number(nouveauSeuil);

    if (Number.isNaN(seuil) || seuil < 0) {
      alert("Le stock minimum doit être valide.");
      return;
    }

    setChargement(true);

    try {
      const { error } = await supabase
        .from("stock_inserts")
        .insert({
          reference: nouvelleReference.trim(),
          designation: nouvelleDesignation.trim(),
          matiere: nouvelleMatiere,
          dimension: nouvelleDimension,
          quantite: 0,
          seuil_minimum: seuil,
        });

      if (error) {
        alert(
          "Impossible de créer la référence : " +
            error.message
        );
        return;
      }

      await chargerInserts();

      setNouvelleReference("");
      setNouvelleDesignation("");
      setNouvelleMatiere("");
      setNouvelleDimension("");
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
            Gestion des inserts disponibles dans l&apos;atelier
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

      {erreur && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Erreur :</strong> {erreur}
        </div>
      )}

      {inserts.length === 0 && !chargement && (
        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-[#2F3437]">
                Aucune référence dans le stock
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Tu peux importer les références et quantités
                de ton tableau initial.
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">
                Inserts en stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des références et quantités disponibles.
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
              {insertsFiltres.length} / {inserts.length} référence(s)
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
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
              onClick={() => setStatutFiltre("recommander")}
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
              onClick={() => setStatutFiltre("rupture")}
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Package size={18} />
                Total pièces
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {totalPieces.toLocaleString("fr-FR")}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une référence..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F95516]"
            />

            <select
              value={matiereFiltre}
              onChange={(e) =>
                setMatiereFiltre(e.target.value)
              }
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
              onChange={(e) =>
                setDimensionFiltre(e.target.value)
              }
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
              onChange={(e) =>
                setStatutFiltre(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="ok">Stock OK</option>
              <option value="recommander">
                À recommander
              </option>
              <option value="rupture">Rupture</option>
            </select>
          </div>

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

        <div className="divide-y divide-slate-100">
          {insertsFiltres.map((item) => {
            const pourcentage = getPourcentage(item);

            return (
              <div
                key={item.id}
                className="px-6 py-6 transition hover:bg-slate-50/60"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-[#2F3437]">
                        {item.designation}
                      </h3>

                      {renderStatut(item)}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>
                        Réf.{" "}
                        <strong>{item.reference}</strong>
                      </span>

                      <span>
                        Matière :{" "}
                        <strong>{item.matiere}</strong>
                      </span>

                      <span>
                        Dimension :{" "}
                        <strong>{item.dimension}</strong>
                      </span>
                    </div>

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

                  <div className="flex flex-wrap gap-2 xl:w-[390px] xl:justify-end">
                    <button
                      type="button"
                      onClick={() => ouvrirSortie(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <Minus size={17} />
                      Sortie
                    </button>

                    <button
                      type="button"
                      onClick={() => ouvrirReception(item)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F95516] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04d13]"
                    >
                      <Plus size={17} />
                      Réception
                    </button>

                    <button
                      type="button"
                      onClick={() => ouvrirAjustement(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings size={17} />
                      Ajuster
                    </button>

                    <button
                      type="button"
                      onClick={() => ouvrirHistorique(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <History size={17} />
                      Historique
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#2F3437]">
                  {modal === "ajouter" &&
                    "Ajouter une référence"}
                  {modal === "reception" &&
                    "Réception de stock"}
                  {modal === "sortie" &&
                    "Sortie de stock"}
                  {modal === "ajustement" &&
                    "Ajuster le stock"}
                  {modal === "historique" &&
                    "Historique"}
                </h2>

                {insertSelectionne && (
                  <p className="mt-1 text-sm text-slate-500">
                    {insertSelectionne.designation} —{" "}
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

            {modal === "ajouter" && (
              <div className="space-y-4 px-6 py-6">
                <input
                  value={nouvelleReference}
                  onChange={(e) =>
                    setNouvelleReference(e.target.value)
                  }
                  placeholder="Référence — ex. ACRC"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

                <input
                  value={nouvelleDesignation}
                  onChange={(e) =>
                    setNouvelleDesignation(e.target.value)
                  }
                  placeholder="Désignation"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={nouvelleMatiere}
                    onChange={(e) =>
                      setNouvelleMatiere(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516]"
                  >
                    <option value="">Matière</option>

                    {matieres.map((matiere) => (
                      <option
                        key={matiere}
                        value={matiere}
                      >
                        {matiere}
                      </option>
                    ))}
                  </select>

                  <select
                    value={nouvelleDimension}
                    onChange={(e) =>
                      setNouvelleDimension(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516]"
                  >
                    <option value="">Dimension</option>

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

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    Stock minimum
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={nouveauSeuil}
                    onChange={(e) =>
                      setNouveauSeuil(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={fermerModal}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                  >
                    Annuler
                  </button>

                  <button
                    onClick={creerReference}
                    className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Créer
                  </button>
                </div>
              </div>
            )}

            {(modal === "reception" ||
              modal === "sortie" ||
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
                        setQuantite(e.target.value)
                      }
                      autoFocus
                      placeholder="Ex. 250"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#F95516]"
                    />
                  </div>

                  <textarea
                    value={commentaire}
                    onChange={(e) =>
                      setCommentaire(e.target.value)
                    }
                    rows={3}
                    placeholder={
                      modal === "ajustement"
                        ? "Motif de l'ajustement"
                        : "Commentaire facultatif"
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={fermerModal}
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                    >
                      Annuler
                    </button>

                    <button
                      onClick={
                        modal === "reception"
                          ? receptionner
                          : modal === "sortie"
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

            {modal === "historique" &&
              insertSelectionne && (
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  {historique.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      Aucun mouvement pour cette référence.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {historique.map((mouvement) => (
                        <div
                          key={mouvement.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex justify-between gap-4">
                            <strong>
                              {mouvement.type ===
                                "reception" &&
                                "📦 Réception"}

                              {mouvement.type === "sortie" &&
                                "➖ Sortie"}

                              {mouvement.type ===
                                "ajustement" &&
                                "⚙️ Ajustement"}
                            </strong>

                            <strong className="text-[#F95516]">
                              {mouvement.quantite.toLocaleString(
                                "fr-FR"
                              )}{" "}
                              pièces
                            </strong>
                          </div>

                          {mouvement.commentaire && (
                            <p className="mt-2 text-sm text-slate-500">
                              {mouvement.commentaire}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-slate-400">
                            {mouvement.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}