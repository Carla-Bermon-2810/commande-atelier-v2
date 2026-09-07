"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    const { data, error } = await supabase
      .from("catalogue")
      .select("*")
      .order("produit");

    if (error) {
      console.error("Erreur articles :", error);
      return;
    }

    setArticles(data || []);
  }

  async function chargerCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("ordre");

    if (error) {
      console.error("Erreur catégories :", error);
      return;
    }

    setCategories(data || []);
  }

  async function chargerFamilles() {
    const { data, error } = await supabase
      .from("famille")
      .select("*")
      .order("famille");

    if (error) {
      console.error("Erreur familles :", error);
      return;
    }

    setFamilles(data || []);
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