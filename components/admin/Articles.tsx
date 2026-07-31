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
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      return;
    }
  
    setFamilles(data || []);
  }

    // ===========================
  // Interface
  // ===========================

  return (
    <div className="grid h-[calc(100vh-220px)] grid-cols-[380px_1fr] gap-6">

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

          <div className="h-full overflow-y-auto rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex justify-end">
            <select
              value={filtrePhoto}
              onChange={(e) => setFiltrePhoto(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2"
            >
              <option value="tous">📦 Tous les articles</option>
              <option value="avec">🖼️ Avec photo</option>
              <option value="sans">📷 Sans photo</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles
            .filter((a) => {
              const texte = [
                a.produit,
                a.categorie,
                a.famille,
                a.grain,
                a.dimension,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            
              const rechercheOK = texte.includes(recherche.toLowerCase());
            
              const categorieOK =
                !filtreCategorie ||
                a.categorie?.trim().toLowerCase() ===
                  filtreCategorie.trim().toLowerCase();
            
              const familleOK =
                !filtreFamille ||
                a.famille?.trim().toLowerCase() ===
                  filtreFamille.trim().toLowerCase();
            
              const aUnePhoto =
                a.photo &&
                a.photo.trim() !== "";
            
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
            })
            .map((article) => (
              <AdminArticleCard
                key={article.id}
                article={article}
              />
            ))}
        </div>
      </div>
    </div>
  );
}