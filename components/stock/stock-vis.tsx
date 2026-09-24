"use client";

import { supabase } from "@/lib/supabase";
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

type Vis = {
  id: number;
  reference: string;
  designation: string;
  matiere: string;
  dimension: string;
  piecesParBoite: number;
  boitesPleines: number;
  piecesRestantes: number;
  seuilBoites: number;
};

export default function StockVis() {
  const [vis, setVis] = useState<Vis[]>([]);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "sortie" | "ajustement" | "ajouter" | "supprimer" | null
  >(null);

  const [visSelectionnee, setVisSelectionnee] = useState<Vis | null>(null);

  const [quantite, setQuantite] = useState("");

  const [nouvelleReference, setNouvelleReference] = useState("");
  const [nouvelleMatiere, setNouvelleMatiere] = useState("");
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
      dimension: item.dimension ?? "—",
      piecesParBoite: Number(item.pieces_par_boite ?? 0),
      boitesPleines: Number(item.boites_pleines ?? 0),
      piecesRestantes: Number(item.pieces_restantes ?? 0),
      seuilBoites: Number(item.seuil_boites ?? 0),
    }));

    setVis(visConverties);
    setChargement(false);
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================

  function fermerModal() {
    setModal(null);
    setVisSelectionnee(null);
    setQuantite("");
  }

  function getStock(item: Vis) {
    return (
      item.boitesPleines * item.piecesParBoite +
      item.piecesRestantes
    );
  }

  function getMaximum(item: Vis) {
    return 4 * item.piecesParBoite;
  }

  function getPourcentage(item: Vis) {
    const maximum = getMaximum(item);

    if (maximum <= 0) return 0;

    return Math.min(
      100,
      Math.round((getStock(item) / maximum) * 100)
    );
  }

  function getStatut(item: Vis) {
    const stock = getStock(item);
    const minimum = item.seuilBoites * item.piecesParBoite;

    if (stock === 0) return "rupture";
    if (stock < minimum) return "recommander";

    return "ok";
  }

  // ============================================================
  // FILTRES
  // ============================================================

  const matieres = useMemo(() => {
    return Array.from(new Set(vis.map((item) => item.matiere)));
  }, [vis]);

  const visFiltres = useMemo(() => {
    return vis.filter((item) => {
      const texte = recherche.toLowerCase();

      const rechercheOK =
        !texte ||
        item.reference.toLowerCase().includes(texte) ||
        item.dimension.toLowerCase().includes(texte) ||
        item.matiere.toLowerCase().includes(texte);

      const matiereOK =
        matiereFiltre === "toutes" ||
        item.matiere === matiereFiltre;

      const statutOK =
        statutFiltre === "tous" ||
        getStatut(item) === statutFiltre;

      return rechercheOK && matiereOK && statutOK;
    });
  }, [vis, recherche, matiereFiltre, statutFiltre]);

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
    setQuantite(String(getStock(item)));
    setModal("ajustement");
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
    const stock = getStock(visSelectionnee);

    if (!qte || qte <= 0) {
      alert("Indique une quantité supérieure à 0.");
      return;
    }

    if (qte > stock) {
      alert(
        `Stock insuffisant : ${stock.toLocaleString(
          "fr-FR"
        )} pièce(s) disponible(s).`
      );
      return;
    }

    const nouveauStock = stock - qte;

    const boitesPleines = Math.floor(
      nouveauStock / visSelectionnee.piecesParBoite
    );

    const piecesRestantes =
      nouveauStock % visSelectionnee.piecesParBoite;

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_vis")
        .update({
          boites_pleines: boitesPleines,
          pieces_restantes: piecesRestantes,
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
    } catch (error: any) {
      console.error("Erreur sortie :", error);

      alert(
        "Une erreur est survenue : " +
          (error?.message || "erreur inconnue")
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

    if (
      Number.isNaN(nouveauStock) ||
      nouveauStock < 0
    ) {
      alert("Indique une quantité valide.");
      return;
    }

    const boitesPleines = Math.floor(
      nouveauStock / visSelectionnee.piecesParBoite
    );

    const piecesRestantes =
      nouveauStock % visSelectionnee.piecesParBoite;

    setChargement(true);
    setErreur("");

    try {
      const { error } = await supabase
        .from("stock_vis")
        .update({
          boites_pleines: boitesPleines,
          pieces_restantes: piecesRestantes,
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
    } catch (error: any) {
      console.error("Erreur ajustement :", error);

      alert(
        "Une erreur est survenue : " +
          (error?.message || "erreur inconnue")
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

    const piecesParBoite = Number(
      nouvellesPiecesParBoite
    );

    const seuil = Number(nouveauSeuil);

    if (piecesParBoite <= 0) {
      alert(
        "Le nombre de pièces par boîte doit être supérieur à 0."
      );
      return;
    }

    if (seuil < 0) {
      alert("Le stock minimum ne peut pas être négatif.");
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
      setNouvelleDimension("");
      setNouvellesPiecesParBoite("200");
      setNouveauSeuil("2");

      fermerModal();
    } catch (error: any) {
      console.error("Erreur création référence :", error);

      alert(
        "Une erreur est survenue : " +
          (error?.message || "erreur inconnue")
      );
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
    } catch (error: any) {
      console.error("Erreur suppression :", error);

      alert(
        "Une erreur est survenue : " +
          (error?.message || "erreur inconnue")
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
    <div className="mx-auto max-w-7xl px-3 py-4 sm:p-6 lg:p-8">

      {/* EN-TÊTE */}

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package
              size={32}
              className="text-[#F95516]"
            />

            <h1 className="text-3xl font-bold text-[#2F3437] sm:text-4xl">
              Stock vis
            </h1>
          </div>

          <p className="mt-2 text-slate-500">
            Gestion des vis disponibles dans l&apos;atelier
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModal("ajouter")}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13] sm:w-auto"
        >
          <Plus size={20} />
          Ajouter une référence
        </button>
      </div>

      {/* STOCK */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">
                Vis en stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des références et des niveaux de stock.
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
              {visFiltres.length} / {vis.length} référence(s)
            </div>
          </div>

          {/* COMPTEURS */}

          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <button
              type="button"
              onClick={() =>
                setStatutFiltre(
                  statutFiltre === "ok" ? "tous" : "ok"
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

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">

            <input
              value={recherche}
              onChange={(e) =>
                setRecherche(e.target.value)
              }
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
              <option value="toutes">
                Toutes les matières
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

          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setMatiereFiltre("toutes");
                setStatutFiltre("tous");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          </div>

        </div>

        {/* LISTE */}

        {chargement && (
          <div className="px-6 py-10 text-center text-slate-500">
            Chargement du stock...
          </div>
        )}

        {erreur && (
          <div className="mx-6 my-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Erreur de chargement du stock : {erreur}
          </div>
        )}

        {!chargement && !erreur && (
          <div className="divide-y divide-slate-100">

            {visFiltres.map((item) => {
              const stock = getStock(item);
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

                        <span>
                          {item.piecesParBoite} pièces / boîte
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

                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#F95516] transition-all"
                            style={{
                              width: `${pourcentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                          <span>
                            📦{" "}
                            <strong className="text-slate-700">
                              {item.boitesPleines}
                            </strong>{" "}
                            boîte(s) pleine(s)
                          </span>

                          <span>
                            Minimum :{" "}
                            <strong className="text-slate-700">
                              {item.seuilBoites} boîte(s)
                            </strong>
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-nowrap items-center gap-2 xl:w-auto xl:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirSortie(item)
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Minus size={17} />
                        Sortie
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirAjustement(item)
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Settings size={17} />
                        Ajuster
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirSuppression(item)
                        }
                        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white p-2.5 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

            {!chargement &&
              visFiltres.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-500">
                  Aucune référence de vis en stock.
                </div>
              )}

          </div>
        )}

      </div>

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

            {modal === "ajouter" && (
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

                <div className="grid grid-cols-2 gap-4">

                  <input
                    value={nouvelleMatiere}
                    onChange={(e) =>
                      setNouvelleMatiere(
                        e.target.value
                      )
                    }
                    placeholder="Matière"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />

                  <input
                    value={nouvelleDimension}
                    onChange={(e) =>
                      setNouvelleDimension(
                        e.target.value
                      )
                    }
                    placeholder="Dimension"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />

                </div>

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
                      Stock minimum
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
              visSelectionnee && (
                <div className="space-y-5 px-6 py-6">

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="text-sm text-slate-500">
                      Stock actuel
                    </div>

                    <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                      {getStock(
                        visSelectionnee
                      ).toLocaleString("fr-FR")}{" "}
                      pièces
                    </div>

                  </div>

                  <div>

                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {modal === "ajustement"
                        ? "Nouveau stock réel"
                        : "Quantité à sortir"}
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
                      placeholder="Ex. 200"
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
