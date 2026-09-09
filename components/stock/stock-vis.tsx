"use client";

import { supabase } from "@/lib/supabase";
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

type Mouvement = {
  id: number;
  visId: number;
  type: "reception" | "sortie" | "ajustement";
  quantite: number;
  commentaire: string;
  date: string;
};

export default function StockVis() {
  const [vis, setVis] = useState<Vis[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "reception" | "sortie" | "ajustement" | "historique" | "ajouter" | null
  >(null);

  const [visSelectionnee, setVisSelectionnee] = useState<Vis | null>(null);

  const [quantite, setQuantite] = useState("");
  const [commentaire, setCommentaire] = useState("");

  const [nouvelleReference, setNouvelleReference] = useState("");
  const [nouvelleDesignation, setNouvelleDesignation] = useState("");
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
        console.error("message :", error.message);
        console.error("details :", error.details);
        console.error("hint :", error.hint);
        console.error("code :", error.code);
        console.error("erreur complète :", JSON.stringify(error));
      
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
      designation: item.designation,
      matiere: item.matiere ?? "—",
      dimension: item.dimension ?? "—",
      piecesParBoite: item.pieces_par_boite,
      boitesPleines: item.boites_pleines,
      piecesRestantes: item.pieces_restantes,
      seuilBoites: item.seuil_boites,
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
    setCommentaire("");
  }

  function getStock(item: Vis) {
    return (
      item.boitesPleines * item.piecesParBoite +
      item.piecesRestantes
    );
  }

  function getMaximum(item: Vis) {
    // Pour l'instant : affichage sur une base de 4 boîtes.
    return 4 * item.piecesParBoite;
  }

  function getPourcentage(item: Vis) {
    return Math.min(
      100,
      Math.round((getStock(item) / getMaximum(item)) * 100)
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
        item.designation.toLowerCase().includes(texte) ||
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
  // HISTORIQUE LOCAL POUR LE MOMENT
  // ============================================================

  function ajouterMouvement(
    visId: number,
    type: Mouvement["type"],
    quantite: number,
    texte: string
  ) {
    setMouvements((anciens) => [
      {
        id: Date.now(),
        visId,
        type,
        quantite,
        commentaire: texte,
        date: new Date().toLocaleString("fr-FR"),
      },
      ...anciens,
    ]);
  }

  // ============================================================
  // OUVERTURE DES MODALES
  // ============================================================

  function ouvrirReception(item: Vis) {
    setVisSelectionnee(item);
    setQuantite("");
    setCommentaire("");
    setModal("reception");
  }

  function ouvrirSortie(item: Vis) {
    setVisSelectionnee(item);
    setQuantite("");
    setCommentaire("");
    setModal("sortie");
  }

  function ouvrirAjustement(item: Vis) {
    setVisSelectionnee(item);
    setQuantite(String(getStock(item)));
    setCommentaire("");
    setModal("ajustement");
  }

  function ouvrirHistorique(item: Vis) {
    setVisSelectionnee(item);
    setModal("historique");
  }

  // ============================================================
  // RECEPTION
  // ============================================================

  async function receptionner() {
    if (!visSelectionnee) return;
  
    const qte = Number(quantite);
  
    if (!qte || qte <= 0) {
      alert("Indique une quantité supérieure à 0.");
      return;
    }
  
    const stock = getStock(visSelectionnee);
    const nouveauStock = stock + qte;
  
    const boitesPleines = Math.floor(
      nouveauStock / visSelectionnee.piecesParBoite
    );
  
    const piecesRestantes =
      nouveauStock % visSelectionnee.piecesParBoite;
  
    setChargement(true);
    setErreur("");
  
    try {
      // 1. Enregistrer le nouveau stock dans Supabase
      const { error: erreurStock } = await supabase
        .from("stock_vis")
        .update({
          boites_pleines: boitesPleines,
          pieces_restantes: piecesRestantes,
        })
        .eq("id", visSelectionnee.id);
  
      if (erreurStock) {
        console.error("Erreur réception vis :", erreurStock);
        alert(
          "Impossible d'enregistrer la réception : " +
            erreurStock.message
        );
        return;
      }
  
      // 2. Enregistrer le mouvement
      const { error: erreurMouvement } = await supabase
        .from("stock_mouvements_vis")
        .insert({
          vis_id: visSelectionnee.id,
          type_mouvement: "reception",
          quantite: qte,
          commentaire: commentaire || "Réception de stock",
        });
  
      if (erreurMouvement) {
        console.error(
          "Erreur mouvement réception vis :",
          erreurMouvement
        );
  
        alert(
          "Le stock a été enregistré, mais l'historique n'a pas pu être enregistré : " +
            erreurMouvement.message
        );
      }
  
      // 3. Recharger depuis Supabase
      await chargerVis();
  
      // 4. Fermer la fenêtre
      fermerModal();
    } catch (error: any) {
      console.error("Erreur réception :", error);
  
      alert(
        "Une erreur est survenue : " +
          (error?.message || "erreur inconnue")
      );
    } finally {
      setChargement(false);
    }
  }

  // ============================================================
  // SORTIE
  // ============================================================

  function sortirStock() {
    if (!visSelectionnee) return;

    const qte = Number(quantite);
    const stock = getStock(visSelectionnee);

    if (!qte || qte <= 0) {
      alert("Indique une quantité supérieure à 0.");
      return;
    }

    if (qte > stock) {
      alert(`Stock insuffisant : ${stock} pièce(s) disponible(s).`);
      return;
    }

    const nouveauStock = stock - qte;

    const boitesPleines = Math.floor(
      nouveauStock / visSelectionnee.piecesParBoite
    );

    const piecesRestantes =
      nouveauStock % visSelectionnee.piecesParBoite;

    setVis((anciens) =>
      anciens.map((item) =>
        item.id === visSelectionnee.id
          ? {
              ...item,
              boitesPleines,
              piecesRestantes,
            }
          : item
      )
    );

    ajouterMouvement(
      visSelectionnee.id,
      "sortie",
      qte,
      commentaire || "Sortie de stock"
    );

    fermerModal();
  }

  // ============================================================
  // AJUSTEMENT
  // ============================================================

  function ajusterStock() {
    if (!visSelectionnee) return;

    const nouveauStock = Number(quantite);

    if (Number.isNaN(nouveauStock) || nouveauStock < 0) {
      alert("Indique une quantité valide.");
      return;
    }

    const boitesPleines = Math.floor(
      nouveauStock / visSelectionnee.piecesParBoite
    );

    const piecesRestantes =
      nouveauStock % visSelectionnee.piecesParBoite;

    setVis((anciens) =>
      anciens.map((item) =>
        item.id === visSelectionnee.id
          ? {
              ...item,
              boitesPleines,
              piecesRestantes,
            }
          : item
      )
    );

    ajouterMouvement(
      visSelectionnee.id,
      "ajustement",
      nouveauStock,
      commentaire || "Ajustement du stock"
    );

    fermerModal();
  }

  // ============================================================
  // CREATION D'UNE REFERENCE
  // ============================================================

  async function creerReference() {
    if (!nouvelleReference || !nouvelleDesignation) {
      alert("La référence et la désignation sont obligatoires.");
      return;
    }
  
    const piecesParBoite = Number(nouvellesPiecesParBoite);
    const seuil = Number(nouveauSeuil);
  
    if (piecesParBoite <= 0) {
      alert("Le nombre de pièces par boîte doit être supérieur à 0.");
      return;
    }
  
    setChargement(true);
    setErreur("");
  
    try {
      const { error } = await supabase
        .from("stock_vis")
        .insert({
          reference: nouvelleReference.trim(),
          designation: nouvelleDesignation.trim(),
          matiere: nouvelleMatiere.trim() || null,
          dimension: nouvelleDimension.trim() || null,
          pieces_par_boite: piecesParBoite,
          boites_pleines: 0,
          pieces_restantes: 0,
          seuil_boites: seuil,
        });
  
      if (error) {
        console.error("Erreur création référence vis :", error);
        alert("Erreur lors de la création : " + error.message);
        return;
      }
  
      // Recharger les références depuis Supabase
      await chargerVis();
  
      // Réinitialiser le formulaire
      setNouvelleReference("");
      setNouvelleDesignation("");
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

  const historique = visSelectionnee
    ? mouvements.filter(
        (mouvement) => mouvement.visId === visSelectionnee.id
      )
    : [];

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="mx-auto max-w-7xl p-8">

      {/* EN-TÊTE */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package size={32} className="text-[#F95516]" />

            <h1 className="text-4xl font-bold text-[#2F3437]">
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
          className="flex items-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13]"
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
                Suivi des références, boîtes pleines et pièces restantes.
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

          </div>

          {/* FILTRES */}
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">

            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une référence, désignation..."
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
                          Réf. <strong>{item.reference}</strong>
                        </span>

                        <span>
                          Matière : <strong>{item.matiere}</strong>
                        </span>

                        <span>
                          Dimension : <strong>{item.dimension}</strong>
                        </span>

                        <span>
                          {item.piecesParBoite} pièces / boîte
                        </span>

                      </div>

                      <div className="mt-5 max-w-2xl">

                        <div className="flex items-end justify-between">

                          <div>
                            <div className="text-sm font-semibold text-slate-600">
                              Stock
                            </div>

                            <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                              {stock.toLocaleString("fr-FR")} pièces
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
                            style={{ width: `${pourcentage}%` }}
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

                          {item.piecesRestantes > 0 && (
                            <span>
                              +{" "}
                              <strong className="text-slate-700">
                                {item.piecesRestantes}
                              </strong>{" "}
                              pièce(s)
                            </span>
                          )}

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

            {!chargement && visFiltres.length === 0 && (
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

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#2F3437]">

                  {modal === "ajouter" && "Ajouter une référence"}
                  {modal === "reception" && "Réception de stock"}
                  {modal === "sortie" && "Sortie de stock"}
                  {modal === "ajustement" && "Ajuster le stock"}
                  {modal === "historique" && "Historique"}

                </h2>

                {visSelectionnee && (
                  <p className="mt-1 text-sm text-slate-500">
                    {visSelectionnee.designation} —{" "}
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
                  onChange={(e) => setNouvelleReference(e.target.value)}
                  placeholder="Référence — ex. VIS-M8X30"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

                <input
                  value={nouvelleDesignation}
                  onChange={(e) =>
                    setNouvelleDesignation(e.target.value)
                  }
                  placeholder="Désignation — ex. Vis CHC M8 × 30"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

                <div className="grid grid-cols-2 gap-4">

                  <input
                    value={nouvelleMatiere}
                    onChange={(e) =>
                      setNouvelleMatiere(e.target.value)
                    }
                    placeholder="Matière"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />

                  <input
                    value={nouvelleDimension}
                    onChange={(e) =>
                      setNouvelleDimension(e.target.value)
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
                        setNouvellesPiecesParBoite(e.target.value)
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
                        setNouveauSeuil(e.target.value)
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

            {/* RECEPTION / SORTIE / AJUSTEMENT */}

            {(modal === "reception" ||
              modal === "sortie" ||
              modal === "ajustement") &&
              visSelectionnee && (
                <div className="space-y-5 px-6 py-6">

                  <div className="rounded-2xl bg-slate-50 p-4">

                    <div className="text-sm text-slate-500">
                      Stock actuel
                    </div>

                    <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                      {getStock(visSelectionnee).toLocaleString(
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
                      onChange={(e) => setQuantite(e.target.value)}
                      autoFocus
                      placeholder="Ex. 200"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#F95516]"
                    />

                  </div>

                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
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

            {/* HISTORIQUE */}

            {modal === "historique" && visSelectionnee && (
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
                            {mouvement.type === "reception" &&
                              "📦 Réception"}

                            {mouvement.type === "sortie" &&
                              "➖ Sortie"}

                            {mouvement.type === "ajustement" &&
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