"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import ArticleForm from "@/components/admin/ArticleForm";

export default function ArticlePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);

  const [article, setArticle] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [familles, setFamilles] = useState<any[]>([]);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setLoading(true);

    const [articleRes, categoriesRes, famillesRes] = await Promise.all([
      supabase
        .from("catalogue")
        .select("*")
        .eq("id", id)
        .single(),

      supabase
        .from("categories")
        .select("*")
        .order("ordre"),

      supabase
        .from("famille")
        .select("*")
        .order("famille"),
    ]);

    if (articleRes.error) {
      console.error(articleRes.error);
      router.push("/admin/articles/nouveau");
      return;
    }

    setArticle(articleRes.data);
    setCategories(categoriesRes.data || []);
    setFamilles(famillesRes.data || []);

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-10">
        Chargement...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-10">
        Article introuvable.
      </div>
    );
  }

  async function enregistrerArticle(data: any) {
    const { error } = await supabase
      .from("catalogue")
      .update(data)
      .eq("id", id);
  
    if (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
      return;
    }
  
    alert("Article enregistré.");
    chargerDonnees();
  }

  async function supprimerArticle() {
    if (!confirm("Supprimer cet article ?")) return;
  
    const { error } = await supabase
      .from("catalogue")
      .delete()
      .eq("id", id);
  
    if (error) {
      console.error(error);
      alert("Erreur lors de la suppression.");
      return;
    }
  
    router.push("/admin");
  }

  return (
    <main className="mx-auto max-w-7xl px-8 py-10">

      <button
        onClick={() => router.push("/admin")}
        className="mb-6 text-[#F95516] hover:underline"
      >
        ← Retour
      </button>

      <ArticleForm
        article={article}
        categories={categories}
        familles={familles}
        onSave={enregistrerArticle}
        onDelete={supprimerArticle}
        />

    </main>
  );
}