"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import ArticleList from "./ArticleList";
import ArticleForm from "./ArticleForm";

export default function Articles() {

  // ===========================
  // Etats
  // ===========================

  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [familles, setFamilles] = useState<any[]>([]);

  const [recherche, setRecherche] = useState("");

  const [articleSelectionne, setArticleSelectionne] = useState<any>(null);

  const [produit, setProduit] = useState("");
  const [categorie, setCategorie] = useState("");
  const [famille, setFamille] = useState("");
  const [grain, setGrain] = useState("");
  const [dimension, setDimension] = useState("");

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
  // Sélection
  // ===========================

  function selectionnerArticle(article: any) {

    setArticleSelectionne(article);

    setProduit(article.produit || "");
    setCategorie(article.categorie || "");
    setFamille(article.famille || "");
    setGrain(article.grain || "");
    setDimension(article.dimension || "");

  }

    // ===========================
  // Nouvel article
  // ===========================

  function nouvelArticle() {
    setArticleSelectionne({
      id: null,
      photo: "",
    });

    setProduit("");
    setCategorie("");
    setFamille("");
    setGrain("");
    setDimension("");
  }
  
  // ===========================
  // Enregistrer
  // ===========================

  async function enregistrerArticle() {
    if (produit.trim() === "") {
      alert("Le produit est obligatoire.");
      return;
    }

    const donnees = {
      produit,
      categorie,
      famille,
      grain,
      dimension,
    };

    let error;

    if (articleSelectionne?.id) {
      ({ error } = await supabase
        .from("catalogue")
        .update(donnees)
        .eq("id", articleSelectionne.id));
    } else {
      ({ error } = await supabase
        .from("catalogue")
        .insert(donnees));
    }

    if (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
      return;
    }

    await chargerArticles();

    // Si c'était un nouvel article, on récupère le dernier créé
    if (!articleSelectionne?.id) {
      const { data } = await supabase
        .from("catalogue")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        selectionnerArticle(data);
      }
    } else {
      const articleMisAJour = {
        ...articleSelectionne,
        ...donnees,
      };

      selectionnerArticle(articleMisAJour);
    }

    alert("Article enregistré.");
  }

  // ===========================
  // Supprimer
  // ===========================

  async function supprimerArticle() {
    if (!articleSelectionne?.id) return;
  
    const confirmation = confirm(
      `Supprimer définitivement "${articleSelectionne.produit}" ?`
    );
  
    if (!confirmation) return;
  
    try {
      // Supprimer la photo du bucket

      if (articleSelectionne.photo) {
        await supabase.storage
          .from("photos")
          .remove([articleSelectionne.photo]);
      }
  
      // Supprimer l'article
      const { data, error } = await supabase
  .from("catalogue")
  .delete()
  .eq("id", articleSelectionne.id)
  .select();

console.log("Article supprimé :", data);
console.log("Erreur :", error);

if (error) throw error;
  
      // Mise à jour de l'interface
      setArticleSelectionne(null);
      setProduit("");
      setCategorie("");
      setFamille("");
      setGrain("");
      setDimension("");
  
      await chargerArticles();
  
      alert("Article supprimé.");
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

    // ===========================
  // Interface
  // ===========================

  return (
    <div className="grid grid-cols-[340px_1fr] gap-8">

      <ArticleList
        articles={articles}
        recherche={recherche}
        setRecherche={setRecherche}
        articleSelectionne={articleSelectionne}
        onSelect={selectionnerArticle}
        onNouveau={nouvelArticle}
      />

      <ArticleForm
        produit={produit}
        setProduit={setProduit}

        categorie={categorie}
        setCategorie={setCategorie}

        famille={famille}
        setFamille={setFamille}

        grain={grain}
        setGrain={setGrain}

        dimension={dimension}
        setDimension={setDimension}

        categories={categories}
        familles={familles}

        articleSelectionne={articleSelectionne}

        onSave={enregistrerArticle}
        onDelete={supprimerArticle}
      />

    </div>
  );
}