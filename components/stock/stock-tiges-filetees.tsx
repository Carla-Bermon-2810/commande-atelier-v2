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
  X,
  XCircle,
} from "lucide-react";

type Tige = {
  id: number;
  numero: string;
  parentId: number | null;
  matiere: string;
  diametre: string;
  longueurCommandee: number;
  longueurDisponible: number;
  statut: "disponible" | "utilise" | "rebut";
  createdAt: string;
};

type Mouvement = {
  id: number;
  tigeId: number | null;
  type: "reception" | "utilisation" | "rebut";
  longueur: number | null;
  tigeSourceId: number | null;
  tigeResultatId: number | null;
  commentaire: string;
  date: string;
};

const diametresParMatiere: Record<string, string[]> = {
  Acier: ["4", "5", "6", "8", "10", "12", "14", "16", "18"],
  Aluminium: ["8"],
  Inox: ["4", "5", "6", "8", "10", "12", "27"],
};

const matieres = ["Acier", "Aluminium", "Inox"];

export default function StockTigesFiletees() {
  const [tiges, setTiges] = useState<Tige[]>([]);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);

  const [recherche, setRecherche] = useState("");
  const [matiereFiltre, setMatiereFiltre] = useState("toutes");
  const [diametreFiltre, setDiametreFiltre] = useState("tous");
  const [statutFiltre, setStatutFiltre] = useState("tous");

  const [modal, setModal] = useState<
    "reception" | "utilisation" | "rebut" | "historique" | null
  >(null);

  const [tigeSelectionnee, setTigeSelectionnee] = useState<Tige | null>(
    null
  );

  const [matiere, setMatiere] = useState("");
  const [diametre, setDiametre] = useState("");
  const [longueur, setLongueur] = useState("1000");
  const [commentaire, setCommentaire] = useState("");

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setChargement(true);
    setErreur("");

    const [
      { data: tigesData, error: tigesError },
      { data: mouvementsData, error: mouvementsError },
    ] = await Promise.all([
      supabase
        .from("stock_tiges_filetees")
        .select("*")
        .order("id", { ascending: true }),

      supabase
        .from("stock_mouvements_tiges")
        .select("*")
        .order("date_mouvement", { ascending: false }),
    ]);

    if (tigesError) {
      console.error("Erreur chargement tiges :", tigesError);
      setErreur(tigesError.message);
      setChargement(false);
      return;
    }

    if (mouvementsError) {
      console.error("Erreur chargement mouvements tiges :", mouvementsError);
      setErreur(mouvementsError.message);
      setChargement(false);
      return;
    }

    const tigesConverties: Tige[] = (tigesData ?? []).map((item) => ({
      id: item.id,
      numero: item.numero,
      parentId: item.parent_id,
      matiere: item.matiere,
      diametre: item.diametre,
      longueurCommandee: Number(item.longueur_commandee),
      longueurDisponible: Number(item.longueur_disponible),
      statut: item.statut,
      createdAt: item.created_at,
    }));

    const mouvementsConvertis: Mouvement[] = (mouvementsData ?? []).map(
      (item) => ({
        id: item.id,
        tigeId: item.tige_id,
        type: item.type_mouvement,
        longueur:
          item.longueur !== null ? Number(item.longueur) : null,
        tigeSourceId: item.tige_source_id,
        tigeResultatId: item.tige_resultat_id,
        commentaire: item.commentaire ?? "",
        date: item.date_mouvement,
      })
    );

    setTiges(tigesConverties);
    setMouvements(mouvementsConvertis);
    setChargement(false);
  }

  function fermerModal() {
    setModal(null);
    setTigeSelectionnee(null);
    setMatiere("");
    setDiametre("");
    setLongueur("1000");
    setCommentaire("");
  }

  function ouvrirReception() {
    setMatiere("");
    setDiametre("");
    setLongueur("1000");
    setCommentaire("");
    setModal("reception");
  }

  function ouvrirUtilisation(tige: Tige) {
    setTigeSelectionnee(tige);
    setLongueur("");
    setCommentaire("");
    setModal("utilisation");
  }

  function ouvrirRebut(tige: Tige) {
    setTigeSelectionnee(tige);
    setCommentaire("");
    setModal("rebut");
  }

  function ouvrirHistorique(tige: Tige) {
    setTigeSelectionnee(tige);
    setModal("historique");
  }

  function getDiametresFiltres() {
    if (matiereFiltre === "toutes") {
      return Array.from(
        new Set(Object.values(diametresParMatiere).flat())
      ).sort((a, b) => Number(a) - Number(b));
    }

    return diametresParMatiere[matiereFiltre] ?? [];
  }

  const tigesFiltrees = useMemo(() => {
    const texte = recherche.toLowerCase().trim();

    return tiges.filter((tige) => {
      const rechercheOK =
        !texte ||
        tige.numero.toLowerCase().includes(texte) ||
        tige.matiere.toLowerCase().includes(texte) ||
        tige.diametre.toLowerCase().includes(texte);

      const matiereOK =
        matiereFiltre === "toutes" ||
        tige.matiere === matiereFiltre;

      const diametreOK =
        diametreFiltre === "tous" ||
        tige.diametre === diametreFiltre;

      const statutOK =
        statutFiltre === "tous" ||
        tige.statut === statutFiltre;

      return rechercheOK && matiereOK && diametreOK && statutOK;
    });
  }, [
    tiges,
    recherche,
    matiereFiltre,
    diametreFiltre,
    statutFiltre,
  ]);

  const nombreDisponibles = tiges.filter(
    (tige) => tige.statut === "disponible"
  ).length;

  const nombreUtilisees = tiges.filter(
    (tige) => tige.statut === "utilise"
  ).length;

  const nombreRebut = tiges.filter(
    (tige) => tige.statut === "rebut"
  ).length;

  const longueurTotaleDisponible = tiges
    .filter((tige) => tige.statut === "disponible")
    .reduce(
      (total, tige) => total + tige.longueurDisponible,
      0
    );

  async function receptionner() {
    if (!matiere) {
      alert("Sélectionne une matière.");
      return;
    }

    if (!diametre) {
      alert("Sélectionne un diamètre.");
      return;
    }

    const longueurReception = Number(longueur);

    if (!longueurReception || longueurReception <= 0) {
      alert("Indique une longueur supérieure à 0 mm.");
      return;
    }

    const numero = `TF-${Date.now()}`;

    const { data, error } = await supabase
      .from("stock_tiges_filetees")
      .insert({
        numero,
        parent_id: null,
        matiere,
        diametre,
        longueur_commandee: longueurReception,
        longueur_disponible: longueurReception,
        statut: "disponible",
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur réception tige :", error);
      alert(`Erreur lors de la réception : ${error.message}`);
      return;
    }

    const { error: mouvementError } = await supabase
      .from("stock_mouvements_tiges")
      .insert({
        tige_id: data.id,
        type_mouvement: "reception",
        longueur: longueurReception,
        tige_source_id: null,
        tige_resultat_id: data.id,
        commentaire: commentaire || "Réception d'une tige filetée",
      });

    if (mouvementError) {
      console.error(
        "Erreur mouvement réception :",
        mouvementError
      );
      alert(
        `La tige a été créée mais l'historique n'a pas pu être enregistré : ${mouvementError.message}`
      );
    }

    fermerModal();
    await chargerDonnees();
  }

  async function utiliserTige() {
    if (!tigeSelectionnee) return;

    const longueurUtilisee = Number(longueur);
    const disponible = tigeSelectionnee.longueurDisponible;

    if (!longueurUtilisee || longueurUtilisee <= 0) {
      alert("Indique une longueur supérieure à 0 mm.");
      return;
    }

    if (longueurUtilisee > disponible) {
      alert(
        `Longueur insuffisante : il reste ${disponible} mm sur cette tige.`
      );
      return;
    }

    const reste = disponible - longueurUtilisee;

    /*
     * 1. Si un reste existe, on crée une nouvelle tige physique.
     */
    let tigeResultatId: number | null = null;

    if (reste > 0) {
      const numeroReste = `TF-${Date.now()}-R`;

      const { data: resteData, error: resteError } = await supabase
        .from("stock_tiges_filetees")
        .insert({
          numero: numeroReste,
          parent_id: tigeSelectionnee.id,
          matiere: tigeSelectionnee.matiere,
          diametre: tigeSelectionnee.diametre,
          longueur_commandee: reste,
          longueur_disponible: reste,
          statut: "disponible",
        })
        .select()
        .single();

      if (resteError) {
        console.error("Erreur création reste :", resteError);
        alert(
          `Impossible de créer le reste de la tige : ${resteError.message}`
        );
        return;
      }

      tigeResultatId = resteData.id;
    }

    /*
     * 2. La tige source devient utilisée.
     */
    const { error: updateError } = await supabase
      .from("stock_tiges_filetees")
      .update({
        longueur_disponible: 0,
        statut: "utilise",
      })
      .eq("id", tigeSelectionnee.id);

    if (updateError) {
      console.error(
        "Erreur mise à jour tige source :",
        updateError
      );
      alert(
        `Erreur lors de la mise à jour de la tige : ${updateError.message}`
      );
      return;
    }

    /*
     * 3. Enregistrement du mouvement.
     */
    const { error: mouvementError } = await supabase
      .from("stock_mouvements_tiges")
      .insert({
        tige_id: tigeSelectionnee.id,
        type_mouvement: "utilisation",
        longueur: longueurUtilisee,
        tige_source_id: tigeSelectionnee.id,
        tige_resultat_id: tigeResultatId,
        commentaire:
          commentaire ||
          `Utilisation de ${longueurUtilisee} mm`,
      });

    if (mouvementError) {
      console.error(
        "Erreur mouvement utilisation :",
        mouvementError
      );
      alert(
        `La tige a été mise à jour mais l'historique n'a pas pu être enregistré : ${mouvementError.message}`
      );
    }

    fermerModal();
    await chargerDonnees();
  }

  async function mettreAuRebut() {
    if (!tigeSelectionnee) return;

    const { error: updateError } = await supabase
      .from("stock_tiges_filetees")
      .update({
        statut: "rebut",
        longueur_disponible: 0,
      })
      .eq("id", tigeSelectionnee.id);

    if (updateError) {
      console.error("Erreur rebut :", updateError);
      alert(
        `Erreur lors de la mise au rebut : ${updateError.message}`
      );
      return;
    }

    const { error: mouvementError } = await supabase
      .from("stock_mouvements_tiges")
      .insert({
        tige_id: tigeSelectionnee.id,
        type_mouvement: "rebut",
        longueur: tigeSelectionnee.longueurDisponible,
        tige_source_id: tigeSelectionnee.id,
        tige_resultat_id: null,
        commentaire: commentaire || "Mise au rebut",
      });

    if (mouvementError) {
      console.error(
        "Erreur mouvement rebut :",
        mouvementError
      );
      alert(
        `La tige a été mise au rebut mais l'historique n'a pas pu être enregistré : ${mouvementError.message}`
      );
    }

    fermerModal();
    await chargerDonnees();
  }

  function renderStatut(tige: Tige) {
    if (tige.statut === "disponible") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={14} />
          DISPONIBLE
        </span>
      );
    }

    if (tige.statut === "utilise") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <CheckCircle2 size={14} />
          UTILISÉE
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle size={14} />
        REBUT
      </span>
    );
  }

  const historique = tigeSelectionnee
    ? mouvements.filter(
        (mouvement) =>
          mouvement.tigeId === tigeSelectionnee.id ||
          mouvement.tigeSourceId === tigeSelectionnee.id ||
          mouvement.tigeResultatId === tigeSelectionnee.id
      )
    : [];

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* EN-TÊTE */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Package size={32} className="text-[#F95516]" />

            <h1 className="text-4xl font-bold text-[#2F3437]">
              Stock tiges filetées
            </h1>
          </div>

          <p className="mt-2 text-slate-500">
            Gestion des tiges filetées disponibles dans l&apos;atelier
          </p>
        </div>

        <button
          type="button"
          onClick={ouvrirReception}
          className="flex items-center gap-2 rounded-2xl bg-[#F95516] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#e04d13]"
        >
          <Plus size={20} />
          Réceptionner une tige
        </button>
      </div>

      {/* ERREUR */}
      {erreur && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <strong>Erreur chargement tiges :</strong> {erreur}
        </div>
      )}

      {/* STOCK */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2F3437]">
                Tiges en stock
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi individuel des tiges et des longueurs restantes.
              </p>
            </div>

            <div className="rounded-xl bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F95516]">
              {tigesFiltrees.length} / {tiges.length} tige(s)
            </div>
          </div>

          {/* COMPTEURS */}
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <button
              type="button"
              onClick={() => setStatutFiltre("disponible")}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-green-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                <CheckCircle2 size={18} />
                Disponibles
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {nombreDisponibles}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatutFiltre("utilise")}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <CheckCircle2 size={18} />
                Utilisées
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {nombreUtilisees}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStatutFiltre("rebut")}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-red-200"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <XCircle size={18} />
                Rebut
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {nombreRebut}
              </div>
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F95516]">
                <Package size={18} />
                Longueur disponible
              </div>

              <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                {longueurTotaleDisponible.toLocaleString("fr-FR")} mm
              </div>
            </div>
          </div>

          {/* FILTRES */}
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une tige..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#F95516]"
            />

            <select
              value={matiereFiltre}
              onChange={(e) => {
                setMatiereFiltre(e.target.value);
                setDiametreFiltre("tous");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="toutes">Toutes les matières</option>

              {matieres.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={diametreFiltre}
              onChange={(e) => setDiametreFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="tous">Tous les diamètres</option>

              {getDiametresFiltres().map((item) => (
                <option key={item} value={item}>
                  Ø {item} mm
                </option>
              ))}
            </select>

            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#F95516]"
            >
              <option value="tous">Tous les statuts</option>
              <option value="disponible">Disponibles</option>
              <option value="utilise">Utilisées</option>
              <option value="rebut">Rebut</option>
            </select>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setMatiereFiltre("toutes");
                setDiametreFiltre("tous");
                setStatutFiltre("tous");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* LISTE */}
        <div className="divide-y divide-slate-100">
          {chargement ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Chargement du stock...
            </div>
          ) : tigesFiltrees.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Package
                size={42}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 font-semibold text-slate-600">
                Aucune tige trouvée
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Réceptionne une nouvelle tige ou modifie les filtres.
              </p>
            </div>
          ) : (
            tigesFiltrees.map((tige) => (
              <div
                key={tige.id}
                className="px-6 py-6 transition hover:bg-slate-50/60"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-[#2F3437]">
                        Tige filetée Ø {tige.diametre}
                      </h3>

                      {renderStatut(tige)}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>
                        N° <strong>{tige.numero}</strong>
                      </span>

                      <span>
                        Matière :{" "}
                        <strong>{tige.matiere}</strong>
                      </span>

                      <span>
                        Ø <strong>{tige.diametre} mm</strong>
                      </span>

                      <span>
                        Commandée :{" "}
                        <strong>
                          {tige.longueurCommandee.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          mm
                        </strong>
                      </span>
                    </div>

                    {tige.statut === "disponible" && (
                      <div className="mt-5 max-w-2xl">
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-600">
                              Longueur disponible
                            </div>

                            <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                              {tige.longueurDisponible.toLocaleString(
                                "fr-FR"
                              )}{" "}
                              mm
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-slate-500">
                              Restant
                            </div>

                            <div className="text-lg font-bold text-[#F95516]">
                              {Math.round(
                                (tige.longueurDisponible /
                                  tige.longueurCommandee) *
                                  100
                              )}{" "}
                              %
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#F95516] transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (tige.longueurDisponible /
                                    tige.longueurCommandee) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {tige.statut === "utilise" && (
                      <div className="mt-4 text-sm text-slate-500">
                        Tige utilisée — longueur restante :{" "}
                        <strong>
                          {tige.longueurDisponible.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          mm
                        </strong>
                      </div>
                    )}

                    {tige.parentId && (
                      <div className="mt-3 text-xs text-slate-400">
                        Reste provenant de la tige #{tige.parentId}
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2 xl:w-[390px] xl:justify-end">
                    {tige.statut === "disponible" && (
                      <>
                        <button
                          type="button"
                          onClick={() => ouvrirUtilisation(tige)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <Minus size={17} />
                          Utiliser
                        </button>

                        <button
                          type="button"
                          onClick={() => ouvrirRebut(tige)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle size={17} />
                          Rebut
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => ouvrirHistorique(tige)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <History size={17} />
                      Historique
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODALES */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            {/* TITRE */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#2F3437]">
                  {modal === "reception" &&
                    "Réceptionner une tige"}

                  {modal === "utilisation" &&
                    "Utiliser une tige"}

                  {modal === "rebut" &&
                    "Mettre la tige au rebut"}

                  {modal === "historique" &&
                    "Historique"}
                </h2>

                {tigeSelectionnee && (
                  <p className="mt-1 text-sm text-slate-500">
                    Tige Ø {tigeSelectionnee.diametre} —{" "}
                    {tigeSelectionnee.matiere}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={fermerModal}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            {/* RECEPTION */}
            {modal === "reception" && (
              <div className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Matière
                  </label>

                  <select
                    value={matiere}
                    onChange={(e) => {
                      setMatiere(e.target.value);
                      setDiametre("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516]"
                  >
                    <option value="">Sélectionner...</option>

                    {matieres.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Diamètre
                  </label>

                  <select
                    value={diametre}
                    onChange={(e) => setDiametre(e.target.value)}
                    disabled={!matiere}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#F95516] disabled:bg-slate-50"
                  >
                    <option value="">
                      {matiere
                        ? "Sélectionner..."
                        : "Choisir d'abord une matière"}
                    </option>

                    {(diametresParMatiere[matiere] ?? []).map(
                      (item) => (
                        <option key={item} value={item}>
                          Ø {item} mm
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Longueur commandée
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={longueur}
                      onChange={(e) =>
                        setLongueur(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 outline-none focus:border-[#F95516]"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      mm
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    La longueur standard est de 1000 mm.
                  </p>
                </div>

                <textarea
                  value={commentaire}
                  onChange={(e) =>
                    setCommentaire(e.target.value)
                  }
                  rows={3}
                  placeholder="Commentaire facultatif"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                />

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
                    onClick={receptionner}
                    className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Réceptionner
                  </button>
                </div>
              </div>
            )}

            {/* UTILISATION */}
            {modal === "utilisation" &&
              tigeSelectionnee && (
                <div className="space-y-5 px-6 py-6">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">
                      Longueur disponible
                    </div>

                    <div className="mt-1 text-2xl font-bold text-[#2F3437]">
                      {tigeSelectionnee.longueurDisponible.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      mm
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Longueur utilisée
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={tigeSelectionnee.longueurDisponible}
                        value={longueur}
                        onChange={(e) =>
                          setLongueur(e.target.value)
                        }
                        autoFocus
                        placeholder="Ex. 350"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-lg outline-none focus:border-[#F95516]"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        mm
                      </span>
                    </div>
                  </div>

                  {Number(longueur) > 0 &&
                    Number(longueur) <=
                      tigeSelectionnee.longueurDisponible && (
                      <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                        <div className="text-sm text-slate-600">
                          Il restera
                        </div>

                        <div className="mt-1 text-xl font-bold text-[#F95516]">
                          {(
                            tigeSelectionnee.longueurDisponible -
                            Number(longueur)
                          ).toLocaleString("fr-FR")}{" "}
                          mm
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Une nouvelle tige sera automatiquement
                          créée avec cette longueur.
                        </div>
                      </div>
                    )}

                  <textarea
                    value={commentaire}
                    onChange={(e) =>
                      setCommentaire(e.target.value)
                    }
                    rows={3}
                    placeholder="Commentaire facultatif"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />

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
                      onClick={utiliserTige}
                      className="rounded-xl bg-[#F95516] px-5 py-3 text-sm font-semibold text-white"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

            {/* REBUT */}
            {modal === "rebut" &&
              tigeSelectionnee && (
                <div className="space-y-5 px-6 py-6">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={22}
                        className="mt-0.5 text-red-600"
                      />

                      <div>
                        <div className="font-semibold text-red-800">
                          Attention
                        </div>

                        <p className="mt-1 text-sm text-red-700">
                          Cette tige sera retirée du stock et
                          enregistrée comme rebut.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-500">
                      Tige concernée
                    </div>

                    <div className="mt-1 font-bold text-[#2F3437]">
                      Ø {tigeSelectionnee.diametre} —{" "}
                      {tigeSelectionnee.matiere}
                    </div>

                    <div className="mt-1 text-sm text-slate-500">
                      {tigeSelectionnee.longueurDisponible.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      mm disponibles
                    </div>
                  </div>

                  <textarea
                    value={commentaire}
                    onChange={(e) =>
                      setCommentaire(e.target.value)
                    }
                    rows={3}
                    placeholder="Motif du rebut"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#F95516]"
                  />

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
                      onClick={mettreAuRebut}
                      className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Confirmer le rebut
                    </button>
                  </div>
                </div>
              )}

            {/* HISTORIQUE */}
            {modal === "historique" &&
              tigeSelectionnee && (
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  {historique.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      Aucun mouvement pour cette tige.
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

                              {mouvement.type === "utilisation" &&
                                "➖ Utilisation"}

                              {mouvement.type === "rebut" &&
                                "❌ Rebut"}
                            </strong>

                            {mouvement.longueur !== null && (
                              <strong className="text-[#F95516]">
                                {mouvement.longueur.toLocaleString(
                                  "fr-FR"
                                )}{" "}
                                mm
                              </strong>
                            )}
                          </div>

                          {mouvement.commentaire && (
                            <p className="mt-2 text-sm text-slate-500">
                              {mouvement.commentaire}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-slate-400">
                            {new Date(
                              mouvement.date
                            ).toLocaleString("fr-FR")}
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