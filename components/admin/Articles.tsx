"use client";

import { useEffect, useState } from "react";
import { adminData } from "@/lib/admin-api";

import ArticleList from "./ArticleList";
import AdminArticleCard from "./AdminArticleCard";

export default function Articles() {
  // ===========================
  // Etats
  // ===========================

  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [familles, setFamilles] = useState<any[]>([]);

  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreFamille, setFiltreFamille] = useState("");
  const [filtrePhoto, setFiltrePhoto] = useState("tous");

  // ===========================
  // Chargement
  // ===========================

  useEffect(() => {
    chargerToutesLesDonnees();
  }, []);

  async function chargerToutesLesDonnees() {
    await Promise.all([
      chargerArticles(),
      chargerCategories(),
      chargerFamilles(),
    ]);
  }

  async function chargerArticles() {
    try { setArticles(await adminData<any[]>("catalogue", "select", { order: "produit" }) ?? []); } catch (error) { console.error("Erreur articles :", error); }
  }

  async function chargerCategories() {
    try { setCategories(await adminData<any[]>("categories", "select", { order: "ordre" }) ?? []); } catch (error) { console.error("Erreur catégories :", error); }
  }

  async function chargerFamilles() {
    try { setFamilles(await adminData<any[]>("famille", "select", { order: "famille" }) ?? []); } catch (error) { console.error("Erreur familles :", error); }
  }

  // ===========================
  // Filtrage des articles
  // ===========================

  const articlesFiltres = articles.filter((article) => {
    const texte = [
      article.produit,
      article.categorie,
      article.famille,
      article.grain,
      article.dimension,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const rechercheOK = texte.includes(recherche.toLowerCase());

    const categorieOK =
      !filtreCategorie ||
      article.categorie?.trim().toLowerCase() ===
        filtreCategorie.trim().toLowerCase();

    const familleOK =
      !filtreFamille ||
      article.famille?.trim().toLowerCase() ===
        filtreFamille.trim().toLowerCase();

    const aUnePhoto =
      !!article.photo && article.photo.trim() !== "";

    const photoOK =
      filtrePhoto === "tous"
        ? true
        : filtrePhoto === "avec"
        ? aUnePhoto
        : !aUnePhoto;

    return (
      rechercheOK &&
      categorieOK &&
      familleOK &&
      photoOK
    );
  });

  // ===========================
  // Interface
  // ===========================

  return (
    <div className="grid h-[calc(100vh-220px)] grid-cols-[380px_1fr] gap-6">

      {/* ===========================
          GAUCHE : filtres
      =========================== */}

      <div className="sticky top-4 h-fit">
        <ArticleList
          articles={articles}
          categories={categories}
          familles={familles}
          recherche={recherche}
          setRecherche={setRecherche}
          filtreCategorie={filtreCategorie}
          setFiltreCategorie={setFiltreCategorie}
          filtreFamille={filtreFamille}
          setFiltreFamille={setFiltreFamille}
        />
      </div>

      {/* ===========================
          DROITE : articles
      =========================== */}

      <div className="h-full overflow-y-auto rounded-xl border bg-white p-6 shadow-sm">

        <p className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Chaque référence est modifiable ou supprimable individuellement. Après votre inventaire, vous pourrez donc corriger ou retirer sans difficulté les références ajoutées pour les essais.
        </p>

        {/* Filtre photo */}

        <div className="mb-6 flex justify-end">
          <select
            value={filtrePhoto}
            onChange={(e) => setFiltrePhoto(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2"
          >
            <option value="tous">
              📦 Tous les articles
            </option>

            <option value="avec">
              🖼️ Avec photo
            </option>

            <option value="sans">
              📷 Sans photo
            </option>
          </select>
        </div>

        {/* Grille */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

          {articlesFiltres.map((article) => (
            <AdminArticleCard
              key={article.id}
              article={article}
            />
          ))}

        </div>

        {/* Aucun résultat */}

        {articlesFiltres.length === 0 && (
          <div className="flex h-64 items-center justify-center text-slate-400">
            Aucun article trouvé.
          </div>
        )}

      </div>
    </div>
  );
}
