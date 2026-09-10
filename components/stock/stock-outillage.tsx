"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Minus,
  Package,
  Plus,
  Settings2,
  X,
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

type Mouvement = {
  id: number;
  type_mouvement: "reception" | "sortie" | "ajustement";
  quantite: number;
  commentaire: string | null;
  date_mouvement: string;
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
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const [recherche, setRecherche] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "ajouter" | "reception" | "sortie" | "ajustement" | "historique" | null
  >(null);

  const [outilSelectionne, setOutilSelectionne] =
    useState<Outil | null>(null);

  const [dimension, setDimension] = useState("");
  const [designation, setDesignation] = useState("");
  const [reference, setReference] = useState("");
  const [quantite, setQuantite] = useState("");
  const [seuilMinimum, setSeuilMinimum] = useState("2");
  const [commentaire, setCommentaire] = useState("");

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

    const { data: mouvementsData, error: mouvementsError } =
      await supabase
        .from(currentConfig.mouvementTable)
        .select("*")
        .order("date_mouvement", { ascending: false });

    if (mouvementsError) {
      console.error(
        "Erreur chargement mouvements :",
        mouvementsError
      );
    }

    setMouvements((mouvementsData as Mouvement[]) || []);
    setChargement(false);
  }

  function getStatut(outil: Outil) {
    if (outil.quantite === 0) return "Rupture";

    if (outil.quantite <= outil.seuil_minimum) {
      return "Stock faible";
    }

    return "Disponible";
  }

  function getPourcentage(outil: Outil) {
    const maximum = Math.max(outil.seuil_minimum * 4, 10);

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

  const disponibles = outils.filter(
    (outil) => getStatut(outil) === "Disponible"
  ).length;

  const faibles = outils.filter(
    (outil) => getStatut(outil) === "Stock faible"
  ).length;

  const ruptures = outils.filter(
    (outil) => getStatut(outil) === "Rupture"
  ).length;

  const totalPieces = outils.reduce(
    (total, outil) => total + outil.quantite,
    0
  );

  function fermerModal() {
    setModal(null);
    setOutilSelectionne(null);
    setDimension("");
    setDesignation("");
    setReference("");
    setQuantite("");
    setSeuilMinimum("2");
    setCommentaire("");
    setErreur("");
  }

  function ouvrirAjout() {
    setErreur("");
    setModal("ajouter");
  }

  function ouvrirReception(outil: Outil) {
    setOutilSelectionne(outil);
    setQuantite("");
    setCommentaire("");
    setErreur("");
    setModal("reception");
  }

  function ouvrirSortie(outil: Outil) {
    setOutilSelectionne(outil);
    setQuantite("");
    setCommentaire("");
    setErreur("");
    setModal("sortie");
  }

  function ouvrirAjustement(outil: Outil) {
    setOutilSelectionne(outil);
    setQuantite(String(outil.quantite));
    setCommentaire("");
    setErreur("");
    setModal("ajustement");
  }

  function ouvrirHistorique(outil: Outil) {
    setOutilSelectionne(outil);
    setErreur("");
    setModal("historique");
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

    if (!Number.isInteger(seuil) || seuil < 0) {
      setErreur("Le stock minimum doit être un nombre entier.");
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
      donnees.reference = reference.trim() || null;
    }

    const { error } = await supabase
      .from(currentConfig.table)
      .insert(donnees);

    if (error) {
      console.error("Erreur ajout référence :", error);
      setErreur(error.message);
      return;
    }

    await chargerStock();
    fermerModal();
  }

  async function enregistrerMouvement(
    typeMouvement: "reception" | "sortie" | "ajustement",
    nouvelleQuantite: number,
    quantiteMouvement: number,
    commentaireMouvement: string
  ) {
    if (!outilSelectionne) return false;

    const { error: stockError } = await supabase
      .from(currentConfig.table)
      .update({
        quantite: nouvelleQuantite,
      })
      .eq("id", outilSelectionne.id);

    if (stockError) {
      setErreur(stockError.message);
      return false;
    }

    const mouvement: Record<string, unknown> = {
      [currentConfig.mouvementId]: outilSelectionne.id,
      type_mouvement: typeMouvement,
      quantite: quantiteMouvement,
      commentaire: commentaireMouvement.trim() || null,
    };

    const { error: mouvementError } = await supabase
      .from(currentConfig.mouvementTable)
      .insert(mouvement);

    if (mouvementError) {
      setErreur(
        `Le stock a été enregistré mais l'historique a échoué : ${mouvementError.message}`
      );
      return false;
    }

    await chargerStock();
    fermerModal();

    return true;
  }

  async function receptionner() {
    if (!outilSelectionne) return;

    const qte = Number(quantite);

    if (!Number.isInteger(qte) || qte <= 0) {
      setErreur("Indique une quantité entière supérieure à 0.");
      return;
    }

    await enregistrerMouvement(
      "reception",
      outilSelectionne.quantite + qte,
      qte,
      commentaire || "Réception de stock"
    );
  }

  async function sortirStock() {
    if (!outilSelectionne) return;

    const qte = Number(quantite);

    if (!Number.isInteger(qte) || qte <= 0) {
      setErreur("Indique une quantité entière supérieure à 0.");
      return;
    }

    if (qte > outilSelectionne.quantite) {
      setErreur(
        `Stock insuffisant : ${outilSelectionne.quantite} pièce(s) disponible(s).`
      );
      return;
    }

    await enregistrerMouvement(
      "sortie",
      outilSelectionne.quantite - qte,
      qte,
      commentaire || "Sortie de stock"
    );
  }

  async function ajusterStock() {
    if (!outilSelectionne) return;

    const nouveauStock = Number(quantite);

    if (
      !Number.isInteger(nouveauStock) ||
      nouveauStock < 0
    ) {
      setErreur("Indique un stock entier valide.");
      return;
    }

    await enregistrerMouvement(
      "ajustement",
      nouveauStock,
      Math.abs(nouveauStock - outilSelectionne.quantite),
      commentaire ||
        `Ajustement : ${outilSelectionne.quantite} → ${nouveauStock}`
    );
  }

  const mouvementsOutil = mouvements.filter(
    (mouvement) =>
      mouvement[
        currentConfig.mouvementId as keyof Mouvement
      ] === outilSelectionne?.id
  );

  function nomOutil(outil: Outil) {
    if (type === "forets") {
      return `Foret ${outil.dimension}`;
    }

    if (type === "fraises") {
      return outil.designation || `Fraise ${outil.dimension}`;
    }

    return `Taraud ${outil.dimension}`;
  }

  return (
    <div className="mx-auto max-w-7xl p-8">

      {/* HEADER */}

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

      {/* PANNEAU */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

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
                Suivi des quantités disponibles dans l&apos;atelier.
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
              {outilsFiltres.length} / {outils.length} référence(s)
            </div>
          </div>

          {/* COMPTEURS */}

          <div className="mt-5 grid gap-3 md:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-600">
                Références
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {outils.length}
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle2 size={18} />
                Disponibles
              </div>

              <div className="mt-1 text-2xl font-bold text-green-700">
                {disponibles}
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                <AlertTriangle size={18} />
                Stock faible
              </div>

              <div className="mt-1 text-2xl font-bold text-orange-700">
                {faibles}
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle size={18} />
                Ruptures
              </div>

              <div className="mt-1 text-2xl font-bold text-red-700">
                {ruptures}
              </div>
            </div>

          </div>

          {/* FILTRES */}

          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <input
              type="text"
              value={recherche}
              onChange={(e) =>
                setRecherche(e.target.value)
              }
              placeholder="Rechercher..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F95516]"
            />

            <select
              value={statutFiltre}
              onChange={(e) =>
                setStatutFiltre(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="Disponible">Disponible</option>
              <option value="Stock faible">Stock faible</option>
              <option value="Rupture">Rupture</option>
            </select>

            <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
              Total :{" "}
              {totalPieces.toLocaleString("fr-FR")} pièce(s)
            </div>

          </div>

        </div>

        {/* LISTE */}

        {chargement ? (
          <div className="px-6 py-16 text-center text-slate-500">
            Chargement du stock...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {outilsFiltres.map((outil) => {
              const statut = getStatut(outil);
              const pourcentage = getPourcentage(outil);

              return (
                <div
                  key={outil.id}
                  className="px-6 py-6 transition hover:bg-slate-50"
                >

                  <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">

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

                        <span
                          className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                            statut === "Disponible"
                              ? "bg-green-50 text-green-700"
                              : statut === "Stock faible"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {statut}
                        </span>

                      </div>

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
                            {outil.seuil_minimum} pièce(s)
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2 xl:w-[390px] xl:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirSortie(outil)
                        }
                        disabled={outil.quantite === 0}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus size={17} />
                        Sortie
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirReception(outil)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F95516] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04d13]"
                      >
                        <Plus size={17} />
                        Réception
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirAjustement(outil)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#F95516] hover:text-[#F95516]"
                      >
                        <Settings2 size={17} />
                        Ajuster
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          ouvrirHistorique(outil)
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

      {/* MODALE */}

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

                {outilSelectionne && (
                  <p className="mt-1 text-sm text-slate-500">
                    {nomOutil(outilSelectionne)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={22} />
              </button>

            </div>

            <div className="px-6 py-6">

              {erreur && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {erreur}
                </div>
              )}

              {/* AJOUT */}

              {modal === "ajouter" && (
                <div className="space-y-4">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Dimension *
                    </label>

                    <input
                      value={dimension}
                      onChange={(e) =>
                        setDimension(e.target.value)
                      }
                      placeholder={
                        type === "forets"
                          ? "Ex. D6"
                          : type === "fraises"
                            ? "Ex. D25"
                            : "Ex. M8"
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                    />
                  </div>

                  {type === "fraises" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Désignation *
                      </label>

                      <input
                        value={designation}
                        onChange={(e) =>
                          setDesignation(e.target.value)
                        }
                        placeholder="Ex. FRAISE A CHANFREINER"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                      />
                    </div>
                  )}

                  {type === "tarauds" && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Référence
                      </label>

                      <input
                        value={reference}
                        onChange={(e) =>
                          setReference(e.target.value)
                        }
                        placeholder="Ex. BLISTER"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Stock minimum
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={seuilMinimum}
                      onChange={(e) =>
                        setSeuilMinimum(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                    />
                  </div>

                </div>
              )}

              {/* RECEPTION / SORTIE */}

              {(modal === "reception" ||
                modal === "sortie") &&
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
                          setQuantite(e.target.value)
                        }
                        autoFocus
                        placeholder="Ex. 10"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                      />
                    </div>

                    <textarea
                      value={commentaire}
                      onChange={(e) =>
                        setCommentaire(e.target.value)
                      }
                      rows={3}
                      placeholder="Commentaire facultatif..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                    />

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
                          setQuantite(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                      />
                    </div>

                    <textarea
                      value={commentaire}
                      onChange={(e) =>
                        setCommentaire(e.target.value)
                      }
                      rows={3}
                      placeholder="Motif de l'ajustement..."
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                    />

                  </div>
                )}

              {/* HISTORIQUE */}

              {modal === "historique" &&
                outilSelectionne && (
                  <div className="max-h-[60vh] overflow-y-auto">

                    {mouvementsOutil.length === 0 ? (
                      <div className="py-10 text-center text-slate-500">
                        Aucun mouvement enregistré.
                      </div>
                    ) : (
                      <div className="space-y-3">

                        {mouvementsOutil.map(
                          (mouvement) => (
                            <div
                              key={mouvement.id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >

                              <div className="flex items-center justify-between">
                                <strong className="text-[#2F3437]">
                                  {mouvement.type_mouvement ===
                                    "reception" &&
                                    "📦 Réception"}

                                  {mouvement.type_mouvement ===
                                    "sortie" &&
                                    "➖ Sortie"}

                                  {mouvement.type_mouvement ===
                                    "ajustement" &&
                                    "⚙️ Ajustement"}
                                </strong>

                                <strong className="text-[#F95516]">
                                  {mouvement.quantite.toLocaleString(
                                    "fr-FR"
                                  )}{" "}
                                  pièce(s)
                                </strong>
                              </div>

                              {mouvement.commentaire && (
                                <p className="mt-2 text-sm text-slate-500">
                                  {mouvement.commentaire}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-slate-400">
                                {new Date(
                                  mouvement.date_mouvement
                                ).toLocaleString("fr-FR")}
                              </p>

                            </div>
                          )
                        )}

                      </div>
                    )}

                  </div>
                )}

            </div>

            {/* FOOTER */}

            {modal !== "historique" && (
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">

                <button
                  type="button"
                  onClick={fermerModal}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>

                {modal === "ajouter" && (
                  <button
                    type="button"
                    onClick={ajouterReference}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-[#e04d13]"
                  >
                    Ajouter
                  </button>
                )}

                {modal === "reception" && (
                  <button
                    type="button"
                    onClick={receptionner}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-[#e04d13]"
                  >
                    Réceptionner
                  </button>
                )}

                {modal === "sortie" && (
                  <button
                    type="button"
                    onClick={sortirStock}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-[#e04d13]"
                  >
                    Enregistrer la sortie
                  </button>
                )}

                {modal === "ajustement" && (
                  <button
                    type="button"
                    onClick={ajusterStock}
                    className="rounded-xl bg-[#F95516] px-5 py-3 font-semibold text-white hover:bg-[#e04d13]"
                  >
                    Enregistrer
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