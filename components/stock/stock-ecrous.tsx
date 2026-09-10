"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  History,
  Minus,
  Package,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Ecrou = {
  id: number;
  reference: string;
  designation: string;
  matiere: string | null;
  dimension: string | null;
  pieces_par_boite: number;
  boites_pleines: number;
  pieces_restantes: number;
  seuil_boites: number;
  created_at: string;
};

type Mouvement = {
  id: number;
  ecrou_id: number;
  type_mouvement: "reception" | "sortie" | "ajustement";
  quantite: number;
  commentaire: string | null;
  date_mouvement: string;
};

const matieres = ["Acier", "Inox", "Laiton", "Aluminium"];

function getStockTotal(ecrou: Ecrou) {
  return (
    ecrou.boites_pleines * ecrou.pieces_par_boite +
    ecrou.pieces_restantes
  );
}

function getMaximum(ecrou: Ecrou) {
  // Capacité d'affichage : 4 boîtes
  return 4 * ecrou.pieces_par_boite;
}

function getPourcentage(ecrou: Ecrou) {
  const maximum = getMaximum(ecrou);

  if (maximum <= 0) return 0;

  return Math.min(
    100,
    Math.round((getStockTotal(ecrou) / maximum) * 100)
  );
}

function getStatut(ecrou: Ecrou) {
  const stock = getStockTotal(ecrou);
  const minimum = ecrou.seuil_boites * ecrou.pieces_par_boite;

  if (stock === 0) {
    return {
      label: "Rupture",
      className: "border-red-200 bg-red-50 text-red-700",
      icon: AlertTriangle,
    };
  }

  if (stock < minimum) {
    return {
      label: "Stock faible",
      className: "border-orange-200 bg-orange-50 text-orange-700",
      icon: AlertTriangle,
    };
  }

  return {
    label: "Disponible",
    className: "border-green-200 bg-green-50 text-green-700",
    icon: CheckCircle2,
  };
}

export default function StockEcrous() {
  const [ecrous, setEcrous] = useState<Ecrou[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);

  const [chargement, setChargement] = useState(true);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "reception" | "sortie" | "ajustement" | "historique" | null
  >(null);

  const [ecrouSelectionne, setEcrouSelectionne] =
    useState<Ecrou | null>(null);

  const [reference, setReference] = useState("");
  const [designation, setDesignation] = useState("");
  const [matiere, setMatiere] = useState("");
  const [dimension, setDimension] = useState("");

  const [piecesParBoite, setPiecesParBoite] = useState("200");
  const [boitesPleines, setBoitesPleines] = useState("1");
  const [piecesRestantes, setPiecesRestantes] = useState("0");
  const [seuilBoites, setSeuilBoites] = useState("2");

  const [quantite, setQuantite] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  // =========================================================
  // CHARGEMENT
  // =========================================================

  async function chargerStock() {
    setChargement(true);
    setErreur("");

    const [
      { data: stockData, error: stockError },
      { data: mouvementsData, error: mouvementsError },
    ] = await Promise.all([
      supabase
        .from("stock_ecrous")
        .select("*")
        .order("designation", { ascending: true }),

      supabase
        .from("stock_mouvements_ecrous")
        .select("*")
        .order("date_mouvement", { ascending: false }),
    ]);

    if (stockError) {
      console.error("Erreur chargement écrous :", stockError);

      setErreur(
        `Impossible de charger le stock : ${stockError.message}`
      );

      setChargement(false);
      return;
    }

    if (mouvementsError) {
      console.error(
        "Erreur chargement mouvements écrous :",
        mouvementsError
      );
    }

    setEcrous((stockData as Ecrou[]) || []);
    setMouvements((mouvementsData as Mouvement[]) || []);

    setChargement(false);
  }

  useEffect(() => {
    chargerStock();
  }, []);

  // =========================================================
  // FILTRES
  // =========================================================

  const ecrousFiltres = useMemo(() => {
    return ecrous.filter((ecrou) => {
      const texte = `
        ${ecrou.reference}
        ${ecrou.designation}
        ${ecrou.dimension || ""}
        ${ecrou.matiere || ""}
      `.toLowerCase();

      const correspondRecherche =
        !recherche ||
        texte.includes(recherche.toLowerCase());

      const correspondMatiere =
        matiereFiltre === "toutes" ||
        ecrou.matiere === matiereFiltre;

      const statut = getStatut(ecrou);

      const correspondStatut =
        statutFiltre === "tous" ||
        statut.label === statutFiltre;

      return (
        correspondRecherche &&
        correspondMatiere &&
        correspondStatut
      );
    });
  }, [
    ecrous,
    recherche,
    matiereFiltre,
    statutFiltre,
  ]);

  // =========================================================
  // COMPTEURS
  // =========================================================

  const totalPieces = ecrous.reduce(
    (total, ecrou) => total + getStockTotal(ecrou),
    0
  );

  const ecrousDisponibles = ecrous.filter(
    (ecrou) => getStockTotal(ecrou) > 0
  ).length;

  const ecrousFaibles = ecrous.filter(
    (ecrou) =>
      getStockTotal(ecrou) > 0 &&
      getStockTotal(ecrou) <
        ecrou.seuil_boites * ecrou.pieces_par_boite
  ).length;

  const ecrousRupture = ecrous.filter(
    (ecrou) => getStockTotal(ecrou) === 0
  ).length;

  // =========================================================
  // RESET
  // =========================================================

  function resetForm() {
    setReference("");
    setDesignation("");
    setMatiere("");
    setDimension("");

    setPiecesParBoite("200");
    setBoitesPleines("1");
    setPiecesRestantes("0");
    setSeuilBoites("2");

    setQuantite("");
    setCommentaire("");

    setEcrouSelectionne(null);
    setErreur("");
  }

  function fermerModal() {
    setModal(null);
    resetForm();
  }

  // =========================================================
  // RECEPTION
  // =========================================================

  function ouvrirReception() {
    resetForm();
    setModal("reception");
  }

  async function receptionner() {
    setErreur("");
    setMessage("");

    if (!reference.trim()) {
      setErreur("La référence est obligatoire.");
      return;
    }

    if (!designation.trim()) {
      setErreur("La désignation est obligatoire.");
      return;
    }

    const piecesBoite = Number(piecesParBoite);
    const boites = Number(boitesPleines);
    const restantes = Number(piecesRestantes);
    const seuil = Number(seuilBoites);

    if (piecesBoite <= 0) {
      setErreur(
        "Le nombre de pièces par boîte doit être supérieur à 0."
      );
      return;
    }

    if (boites < 0 || restantes < 0) {
      setErreur(
        "Les quantités ne peuvent pas être négatives."
      );
      return;
    }

    if (restantes >= piecesBoite) {
      setErreur(
        "Les pièces restantes doivent être inférieures au nombre de pièces par boîte."
      );
      return;
    }

    const { data: nouveauEcrou, error: insertError } =
      await supabase
        .from("stock_ecrous")
        .insert({
          reference: reference.trim(),
          designation: designation.trim(),
          matiere: matiere || null,
          dimension: dimension.trim() || null,
          pieces_par_boite: piecesBoite,
          boites_pleines: boites,
          pieces_restantes: restantes,
          seuil_boites: seuil,
        })
        .select()
        .single();

    if (insertError) {
      console.error("Erreur réception écrou :", insertError);
      setErreur(insertError.message);
      return;
    }

    const quantiteTotale =
      boites * piecesBoite + restantes;

    const { error: mouvementError } =
      await supabase
        .from("stock_mouvements_ecrous")
        .insert({
          ecrou_id: nouveauEcrou.id,
          type_mouvement: "reception",
          quantite: quantiteTotale,
          commentaire: commentaire.trim() || null,
        });

    if (mouvementError) {
      console.error(
        "Erreur mouvement réception :",
        mouvementError
      );

      setErreur(
        `L'écrou a été créé mais l'historique n'a pas pu être enregistré : ${mouvementError.message}`
      );

      return;
    }

    fermerModal();

    setMessage("Écrous réceptionnés avec succès.");

    await chargerStock();
  }

  // =========================================================
  // SORTIE
  // =========================================================

  function ouvrirSortie(ecrou: Ecrou) {
    setEcrouSelectionne(ecrou);
    setQuantite("");
    setCommentaire("");
    setErreur("");
    setModal("sortie");
  }

  async function enregistrerSortie() {
    if (!ecrouSelectionne) return;

    setErreur("");
    setMessage("");

    const quantiteSortie = Number(quantite);

    const stockActuel =
      getStockTotal(ecrouSelectionne);

    if (!quantiteSortie || quantiteSortie <= 0) {
      setErreur(
        "Indique une quantité supérieure à 0."
      );
      return;
    }

    if (quantiteSortie > stockActuel) {
      setErreur(
        `Stock insuffisant. Il reste ${stockActuel.toLocaleString(
          "fr-FR"
        )} pièce(s).`
      );
      return;
    }

    const nouveauTotal =
      stockActuel - quantiteSortie;

    const nouvellesBoites = Math.floor(
      nouveauTotal /
        ecrouSelectionne.pieces_par_boite
    );

    const nouvellesPieces =
      nouveauTotal %
      ecrouSelectionne.pieces_par_boite;

    const { error: updateError } =
      await supabase
        .from("stock_ecrous")
        .update({
          boites_pleines: nouvellesBoites,
          pieces_restantes: nouvellesPieces,
        })
        .eq("id", ecrouSelectionne.id);

    if (updateError) {
      console.error(
        "Erreur mise à jour sortie :",
        updateError
      );

      setErreur(updateError.message);
      return;
    }

    const { error: mouvementError } =
      await supabase
        .from("stock_mouvements_ecrous")
        .insert({
          ecrou_id: ecrouSelectionne.id,
          type_mouvement: "sortie",
          quantite: quantiteSortie,
          commentaire:
            commentaire.trim() || null,
        });

    if (mouvementError) {
      console.error(
        "Erreur mouvement sortie :",
        mouvementError
      );

      setErreur(mouvementError.message);
      return;
    }

    fermerModal();

    setMessage("Sortie de stock enregistrée.");

    await chargerStock();
  }

  // =========================================================
  // AJUSTEMENT
  // =========================================================

  function ouvrirAjustement(ecrou: Ecrou) {
    setEcrouSelectionne(ecrou);

    setBoitesPleines(
      String(ecrou.boites_pleines)
    );

    setPiecesRestantes(
      String(ecrou.pieces_restantes)
    );

    setCommentaire("");
    setErreur("");

    setModal("ajustement");
  }

  async function enregistrerAjustement() {
    if (!ecrouSelectionne) return;

    setErreur("");
    setMessage("");

    const nouvellesBoites = Number(boitesPleines);
    const nouvellesPieces = Number(piecesRestantes);

    if (
      nouvellesBoites < 0 ||
      nouvellesPieces < 0
    ) {
      setErreur(
        "Les quantités ne peuvent pas être négatives."
      );
      return;
    }

    if (
      nouvellesPieces >=
      ecrouSelectionne.pieces_par_boite
    ) {
      setErreur(
        "Les pièces restantes doivent être inférieures au nombre de pièces par boîte."
      );
      return;
    }

    const ancienStock =
      getStockTotal(ecrouSelectionne);

    const nouveauStock =
      nouvellesBoites *
        ecrouSelectionne.pieces_par_boite +
      nouvellesPieces;

    const difference =
      nouveauStock - ancienStock;

    const { error: updateError } =
      await supabase
        .from("stock_ecrous")
        .update({
          boites_pleines: nouvellesBoites,
          pieces_restantes: nouvellesPieces,
        })
        .eq("id", ecrouSelectionne.id);

    if (updateError) {
      console.error(
        "Erreur ajustement écrou :",
        updateError
      );

      setErreur(updateError.message);
      return;
    }

    const { error: mouvementError } =
      await supabase
        .from("stock_mouvements_ecrous")
        .insert({
          ecrou_id: ecrouSelectionne.id,
          type_mouvement: "ajustement",
          quantite: Math.abs(difference),
          commentaire:
            commentaire.trim() ||
            `Ajustement : ${ancienStock} → ${nouveauStock} pièce(s)`,
        });

    if (mouvementError) {
      console.error(
        "Erreur mouvement ajustement :",
        mouvementError
      );

      setErreur(mouvementError.message);
      return;
    }

    fermerModal();

    setMessage("Stock ajusté avec succès.");

    await chargerStock();
  }

  // =========================================================
  // HISTORIQUE
  // =========================================================

  function ouvrirHistorique(ecrou: Ecrou) {
    setEcrouSelectionne(ecrou);
    setErreur("");
    setModal("historique");
  }

  const mouvementsEcrou = mouvements.filter(
    (mouvement) =>
      mouvement.ecrou_id ===
      ecrouSelectionne?.id
  );

  // =========================================================
  // RENDU
  // =========================================================

  return (
    <div className="mx-auto max-w-7xl p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package
              size={32}
              className="text-[#F95516]"
            />

            <h1 className="text-4xl font-bold text-[#2F3437]">
              Stock écrous
            </h1>
          </div>

          <p className="mt-2 text-slate-500">
            Gestion des écrous disponibles dans l&apos;atelier
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirReception}
          className="flex items-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13]"
        >
          <Plus size={20} />
          Ajouter une référence
        </button>
      </div>

      {/* =====================================================
          MESSAGES
      ===================================================== */}

      {message && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      {erreur && !modal && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {erreur}
        </div>
      )}

      {/* =====================================================
          BLOC STOCK
      ===================================================== */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">
                Écrous en stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des références, quantités et mouvements
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
              {ecrousFiltres.length} / {ecrous.length} référence(s)
            </div>
          </div>

          {/* =================================================
              COMPTEURS
          ================================================= */}

          <div className="mt-5 grid gap-3 md:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Références
              </p>

              <p className="mt-1 text-2xl font-bold text-[#2F3437]">
                {ecrous.length}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                Disponibles
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                {ecrousDisponibles}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-700">
                Stock faible
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-700">
                {ecrousFaibles}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Ruptures
              </p>

              <p className="mt-1 text-2xl font-bold text-red-700">
                {ecrousRupture}
              </p>
            </div>
          </div>

          {/* =================================================
              FILTRES
          ================================================= */}

          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={recherche}
                onChange={(e) =>
                  setRecherche(e.target.value)
                }
                placeholder="Rechercher une référence..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={matiereFiltre}
              onChange={(e) =>
                setMatiereFiltre(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
            >
              <option value="toutes">
                Toutes les matières
              </option>

              {matieres.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={statutFiltre}
              onChange={(e) =>
                setStatutFiltre(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
            >
              <option value="tous">
                Tous les statuts
              </option>

              <option value="Disponible">
                Disponible
              </option>

              <option value="Stock faible">
                Stock faible
              </option>

              <option value="Rupture">
                Rupture
              </option>
            </select>
          </div>

          {/* =================================================
              TOTAL
          ================================================= */}

          <div className="mt-3 flex flex-wrap gap-3">

            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
              Total :{" "}
              {totalPieces.toLocaleString("fr-FR")}{" "}
              pièce(s)
            </div>

            {(recherche ||
              matiereFiltre !== "toutes" ||
              statutFiltre !== "tous") && (
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  setMatiereFiltre("toutes");
                  setStatutFiltre("tous");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#F95516]"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>

        {/* ===================================================
            CHARGEMENT
        =================================================== */}

        {chargement ? (
          <div className="px-6 py-16 text-center text-slate-500">
            Chargement du stock...
          </div>
        ) : ecrousFiltres.length === 0 ? (
          <div className="px-6 py-16 text-center">

            <Package
              size={48}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-semibold text-slate-600">
              Aucun écrou trouvé
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Ajoute une première référence avec le bouton
              &quot;Réceptionner&quot;.
            </p>
          </div>
        ) : (

          /* =================================================
             LISTE
          ================================================= */

          <div className="divide-y divide-slate-100">

            {ecrousFiltres.map((ecrou) => {
              const stock = getStockTotal(ecrou);
              const pourcentage =
                getPourcentage(ecrou);

              const statut = getStatut(ecrou);
              const StatusIcon = statut.icon;

              return (
                <div
                  key={ecrou.id}
                  className="px-6 py-6 transition hover:bg-slate-50"
                >

                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

                    {/* =================================================
                        INFORMATIONS
                    ================================================= */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-3">

                        <h3 className="text-lg font-bold text-[#2F3437]">
                          {ecrou.designation}
                        </h3>

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {ecrou.reference}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statut.className}`}
                        >
                          <StatusIcon size={14} />
                          {statut.label}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                        {ecrou.matiere && (
                          <span>
                            Matière :{" "}
                            <strong className="text-slate-700">
                              {ecrou.matiere}
                            </strong>
                          </span>
                        )}

                        {ecrou.dimension && (
                          <span>
                            Dimension :{" "}
                            <strong className="text-slate-700">
                              {ecrou.dimension}
                            </strong>
                          </span>
                        )}

                        <span>
                          {ecrou.pieces_par_boite.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          pièces / boîte
                        </span>
                      </div>

                      {/* =================================================
                          STOCK + POURCENTAGE + BARRE
                      ================================================= */}

                      <div className="mt-5 max-w-2xl">

                        <div className="flex items-end justify-between">

                          <div>
                            <div className="text-sm font-semibold text-slate-600">
                              Stock
                            </div>

                            <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                              {stock.toLocaleString(
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

                        {/* BARRE DE PROGRESSION */}

                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-[#F95516] transition-all"
                            style={{
                              width: `${pourcentage}%`,
                            }}
                          />
                        </div>

                        {/* DETAILS STOCK */}

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                          <span>
                            📦{" "}
                            <strong className="text-slate-700">
                              {ecrou.boites_pleines}
                            </strong>{" "}
                            boîte(s) pleine(s)
                          </span>

                          {ecrou.pieces_restantes >
                            0 && (
                            <span>
                              +{" "}
                              <strong className="text-slate-700">
                                {
                                  ecrou.pieces_restantes
                                }
                              </strong>{" "}
                              pièce(s)
                            </span>
                          )}

                          <span>
                            Minimum :{" "}
                            <strong className="text-slate-700">
                              {ecrou.seuil_boites}{" "}
                              boîte(s)
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="flex flex-wrap gap-2 xl:w-[390px] xl:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirSortie(ecrou)
                        }
                        disabled={stock === 0}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={17} />
                        Sortie
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setEcrouSelectionne(ecrou);
                          setPiecesParBoite(
                            String(
                              ecrou.pieces_par_boite
                            )
                          );
                          setBoitesPleines("1");
                          setPiecesRestantes("0");
                          setSeuilBoites(
                            String(ecrou.seuil_boites)
                          );
                          setReference(
                            ecrou.reference
                          );
                          setDesignation(
                            ecrou.designation
                          );
                          setMatiere(
                            ecrou.matiere || ""
                          );
                          setDimension(
                            ecrou.dimension || ""
                          );
                          setModal("reception");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F95516] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04d13]"
                      >
                        <Plus size={17} />
                        Réception
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirAjustement(ecrou)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#F95516] hover:text-[#F95516]"
                      >
                        <Settings2 size={17} />
                        Ajuster
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirHistorique(ecrou)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#F95516] hover:text-[#F95516]"
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
        )}
      </div>

      {/* =========================================================
          MODALE
      ========================================================= */}

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">

          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

            {/* ===================================================
                HEADER MODALE
            =================================================== */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-[#2F3437]">

                  {modal === "reception" &&
                    "Réceptionner des écrous"}

                  {modal === "sortie" &&
                    "Sortie de stock"}

                  {modal === "ajustement" &&
                    "Ajuster le stock"}

                  {modal === "historique" &&
                    "Historique"}
                </h2>

                {ecrouSelectionne && (
                  <p className="mt-1 text-sm text-slate-500">
                    {ecrouSelectionne.designation} —{" "}
                    {ecrouSelectionne.reference}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={22} />
              </button>
            </div>

            {/* ===================================================
                CONTENU
            =================================================== */}

            <div className="max-h-[75vh] overflow-y-auto px-6 py-6">

              {erreur && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {erreur}
                </div>
              )}

              {/* =================================================
                  RECEPTION
              ================================================= */}

              {modal === "reception" && (
                <div className="space-y-5">

                  <div className="grid gap-4 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Référence *
                      </label>

                      <input
                        value={reference}
                        onChange={(e) =>
                          setReference(
                            e.target.value
                          )
                        }
                        placeholder="Ex. EC-M8"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

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
                        placeholder="Ex. Écrou hexagonal M8"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Matière
                      </label>

                      <select
                        value={matiere}
                        onChange={(e) =>
                          setMatiere(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="">
                          Non renseignée
                        </option>

                        {matieres.map((item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Dimension
                      </label>

                      <input
                        value={dimension}
                        onChange={(e) =>
                          setDimension(
                            e.target.value
                          )
                        }
                        placeholder="Ex. M8"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Pièces / boîte
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={piecesParBoite}
                        onChange={(e) =>
                          setPiecesParBoite(
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
                        value={boitesPleines}
                        onChange={(e) =>
                          setBoitesPleines(
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Pièces restantes
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={piecesRestantes}
                        onChange={(e) =>
                          setPiecesRestantes(
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
                      value={seuilBoites}
                      onChange={(e) =>
                        setSeuilBoites(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />

                    <p className="mt-1 text-xs text-slate-400">
                      Alerte lorsque le stock passe sous ce
                      niveau.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Commentaire
                    </label>

                    <textarea
                      value={commentaire}
                      onChange={(e) =>
                        setCommentaire(
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder="Facultatif..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-800">
                    Quantité totale réceptionnée :{" "}
                    <strong>
                      {(
                        Number(
                          boitesPleines || 0
                        ) *
                          Number(
                            piecesParBoite || 0
                          ) +
                        Number(
                          piecesRestantes || 0
                        )
                      ).toLocaleString(
                        "fr-FR"
                      )}{" "}
                      pièce(s)
                    </strong>
                  </div>
                </div>
              )}

              {/* =================================================
                  SORTIE
              ================================================= */}

              {modal === "sortie" &&
                ecrouSelectionne && (
                  <div className="space-y-5">

                    <div className="rounded-2xl bg-slate-50 p-4">

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-slate-500">
                          Stock actuel
                        </span>

                        <strong className="text-xl text-[#2F3437]">
                          {getStockTotal(
                            ecrouSelectionne
                          ).toLocaleString(
                            "fr-FR"
                          )}{" "}
                          pièce(s)
                        </strong>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Quantité à sortir *
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
                        placeholder="Ex. 20"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Commentaire
                      </label>

                      <textarea
                        value={commentaire}
                        onChange={(e) =>
                          setCommentaire(
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Facultatif..."
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>
                )}

              {/* =================================================
                  AJUSTEMENT
              ================================================= */}

              {modal === "ajustement" &&
                ecrouSelectionne && (
                  <div className="space-y-5">

                    <div className="rounded-2xl bg-slate-50 p-4">

                      <div className="flex items-center justify-between">

                        <span className="text-sm text-slate-500">
                          Stock actuel
                        </span>

                        <strong className="text-xl text-[#2F3437]">
                          {getStockTotal(
                            ecrouSelectionne
                          ).toLocaleString(
                            "fr-FR"
                          )}{" "}
                          pièce(s)
                        </strong>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Boîtes pleines
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={boitesPleines}
                          onChange={(e) =>
                            setBoitesPleines(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Pièces restantes
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={piecesRestantes}
                          onChange={(e) =>
                            setPiecesRestantes(
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Commentaire
                      </label>

                      <textarea
                        value={commentaire}
                        onChange={(e) =>
                          setCommentaire(
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Pourquoi cet ajustement ?"
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                  </div>
                )}

              {/* =================================================
                  HISTORIQUE
              ================================================= */}

              {modal === "historique" &&
                ecrouSelectionne && (
                  <div>

                    {mouvementsEcrou.length ===
                    0 ? (
                      <div className="py-10 text-center text-slate-500">
                        Aucun mouvement enregistré.
                      </div>
                    ) : (
                      <div className="space-y-3">

                        {mouvementsEcrou.map(
                          (mouvement) => (
                            <div
                              key={mouvement.id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >

                              <div className="flex items-center justify-between gap-4">

                                <div className="flex items-center gap-3">

                                  {mouvement.type_mouvement ===
                                    "reception" && (
                                    <div className="rounded-xl bg-green-50 p-2 text-green-600">
                                      <Plus size={18} />
                                    </div>
                                  )}

                                  {mouvement.type_mouvement ===
                                    "sortie" && (
                                    <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
                                      <Trash2
                                        size={18}
                                      />
                                    </div>
                                  )}

                                  {mouvement.type_mouvement ===
                                    "ajustement" && (
                                    <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                                      <Settings2
                                        size={18}
                                      />
                                    </div>
                                  )}

                                  <div>

                                    <p className="font-semibold text-[#2F3437]">
                                      {mouvement.type_mouvement ===
                                        "reception" &&
                                        "Réception"}

                                      {mouvement.type_mouvement ===
                                        "sortie" &&
                                        "Sortie"}

                                      {mouvement.type_mouvement ===
                                        "ajustement" &&
                                        "Ajustement"}
                                    </p>

                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                      <Clock3
                                        size={13}
                                      />

                                      {new Date(
                                        mouvement.date_mouvement
                                      ).toLocaleString(
                                        "fr-FR"
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <strong className="text-lg text-[#2F3437]">
                                  {mouvement.quantite.toLocaleString(
                                    "fr-FR"
                                  )}
                                </strong>
                              </div>

                              {mouvement.commentaire && (
                                <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                                  {
                                    mouvement.commentaire
                                  }
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* ===================================================
                FOOTER MODALE
            =================================================== */}

            {modal !== "historique" && (
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

                <button
                  type="button"
                  onClick={fermerModal}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>

                {modal === "reception" && (
                  <button
                    type="button"
                    onClick={receptionner}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white transition hover:bg-[#e04d13]"
                  >
                    Réceptionner
                  </button>
                )}

                {modal === "sortie" && (
                  <button
                    type="button"
                    onClick={enregistrerSortie}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white transition hover:bg-[#e04d13]"
                  >
                    Enregistrer la sortie
                  </button>
                )}

                {modal === "ajustement" && (
                  <button
                    type="button"
                    onClick={enregistrerAjustement}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white transition hover:bg-[#e04d13]"
                  >
                    Enregistrer l&apos;ajustement
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}