"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");

  const [articleSelectionne, setArticleSelectionne] = useState<any>(null);

  const [nomArticle, setNomArticle] = useState("");
  const [produit, setProduit] = useState("");
  const [variation, setVariation] = useState("");

  const [fichier, setFichier] = useState<File | null>(null);

  const [uploadEnCours, setUploadEnCours] = useState(false);

  useEffect(() => {
    chargerArticles();
  }, []);

  async function chargerArticles() {
    const { data, error } = await supabase
      .from("catalogue")
      .select("*")
      .not("article", "is", null)
      .order("article");

    if (error) {
      console.error(error);
      return;
    }

    setArticles(data || []);
  }
  function analyserArticle() {
    if (!nomArticle) return;
  
    const texte = nomArticle.toUpperCase();
  
    let nouveauProduit = "";
    let nouvelleVariation = "";
  
    // -------- DISQUE FIBRE --------
    if (texte.includes("DISQUE FIBRE")) {
      nouveauProduit = texte.includes("CERAMIQUE")
        ? "Disque fibre céramique"
        : "Disque fibre";
  
      const diametre = texte.match(/Ø?\d+/)?.[0] || "";
      const grain = texte.match(/G\d+/)?.[0] || "";
  
      nouvelleVariation = [diametre, grain]
        .filter(Boolean)
        .join(" - ");
    }
  
    // -------- DISQUE LAMELLES --------
    else if (texte.includes("LAMELLE")) {
      nouveauProduit = texte.includes("PLAT")
        ? "Disque à lamelles plat"
        : "Disque à lamelles";
  
      const diametre = texte.match(/Ø?\d+/)?.[0] || "";
      const grain = texte.match(/G\d+/)?.[0] || "";
  
      nouvelleVariation = [diametre, grain]
        .filter(Boolean)
        .join(" - ");
    }
  
    // -------- TRIZACT --------
    else if (texte.includes("TRIZACT")) {
      nouveauProduit = "Trizact";
  
      const diametre = texte.match(/Ø?\d+/)?.[0] || "";
      const grain = texte.match(/A\d+/)?.[0] || "";
  
      nouvelleVariation = [diametre, grain]
        .filter(Boolean)
        .join(" - ");
    }
  
    // -------- ACETONE --------
    else if (texte.includes("ACETONE")) {
      nouveauProduit = "Acétone";
      nouvelleVariation = "";
    }
  
    setProduit(nouveauProduit);
    setVariation(nouvelleVariation);
  }
  async function enregistrerModifications() {
    if (!articleSelectionne) return;

    let photoUrl = articleSelectionne.photo;

    try {
      setUploadEnCours(true);

      // Upload d'une nouvelle photo si une a été choisie
      if (fichier) {
        const extension = fichier.name.split(".").pop();

        const nomFichier =
          Date.now() +
          "-" +
          nomArticle.replace(/[^a-zA-Z0-9]/g, "_") +
          "." +
          extension;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(nomFichier, fichier);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("photos")
          .getPublicUrl(nomFichier);

        photoUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from("catalogue")
        .update({
          article: nomArticle,
          produit: produit,
          variation: variation,
          photo: photoUrl,
        })
        .eq("article", articleSelectionne.article);

      if (error) {
        alert(error.message);
        return;
      }

      alert("✅ Modifications enregistrées");

      setArticleSelectionne({
        ...articleSelectionne,
        article: nomArticle,
        produit,
        variation,
        photo: photoUrl,
      });

      setFichier(null);

      await chargerArticles();
    } catch (e) {
      console.error(e);
      alert("Une erreur est survenue.");
    } finally {
      setUploadEnCours(false);
    }
  }
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-8 shadow">
  
        <h1 className="mb-8 text-3xl font-bold">
          📦 Gestion des articles
        </h1>
  
        <input
          type="text"
          placeholder="Rechercher un article..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="mb-8 w-full rounded-lg border p-3"
        />
  
        <div className="grid grid-cols-2 gap-8">
  
          {/* LISTE DES ARTICLES */}
  
          <div>
  
            <div className="max-h-[650px] overflow-y-auto rounded-xl border">
  
              {articles
                .filter((a) =>
                  a.article
                    ?.toLowerCase()
                    .includes(recherche.toLowerCase())
                )
                .map((a) => (
                  <button
                    key={a.article}
                    onClick={() => {
                      setArticleSelectionne(a);
  
                      setNomArticle(a.article || "");
                      setProduit(a.produit || "");
                      setVariation(a.variation || "");
  
                      setFichier(null);
                    }}
                    className={`block w-full border-b p-3 text-left hover:bg-gray-100 ${
                      articleSelectionne?.article === a.article
                        ? "bg-blue-100"
                        : ""
                    }`}
                  >
                    {a.article}
                  </button>
                ))}
  
            </div>
  
          </div>
  
          {/* FORMULAIRE */}
  
          <div>
  
            <div className="mb-6 flex h-64 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
  
              {articleSelectionne?.photo ? (
                <img
                  src={articleSelectionne.photo}
                  alt=""
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-7xl">
                  📦
                </span>
              )}
  
            </div>
  
            <label className="mb-2 block font-semibold">
              Nom de l'article
            </label>
  
            <input
              value={nomArticle}
              onChange={(e) => setNomArticle(e.target.value)}
              className="mb-5 w-full rounded-lg border p-3"
            />
  
            <label className="mb-2 block font-semibold">
              Produit
            </label>
  
            <input
              value={produit}
              onChange={(e) => setProduit(e.target.value)}
              className="mb-5 w-full rounded-lg border p-3"
            />
  
            <label className="mb-2 block font-semibold">
              Variation
            </label>
  
            <input
              value={variation}
              onChange={(e) => setVariation(e.target.value)}
              className="mb-5 w-full rounded-lg border p-3"
            />
  
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFichier(e.target.files[0]);
                }
              }}
              className="mb-3"
            />
  
            {fichier && (
              <p className="mb-5 text-green-600">
                📷 {fichier.name}
              </p>
            )}

            <button
              type="button"
              onClick={analyserArticle}
              disabled={!articleSelectionne}
              className="mb-4 w-full rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 disabled:bg-gray-400"
            >
              🤖 Analyser automatiquement
            </button>
            
            <button
              onClick={enregistrerModifications}
              disabled={!articleSelectionne || uploadEnCours}
              className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploadEnCours
                ? "⏳ Enregistrement..."
                : "💾 Enregistrer les modifications"}
            </button>
  
          </div>
  
        </div>

    </div>
  </main>
);
}