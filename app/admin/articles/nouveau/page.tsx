"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminData } from "@/lib/admin-api";

import ArticleForm, { type ArticleFormData } from "@/components/admin/ArticleForm";

type Category = { id: number; nom: string };
type Family = { id: number; categorie?: string | null; famille: string };
type CreatedArticle = { id: number };

export default function NouveauArticlePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [familles, setFamilles] = useState<Family[]>([]);

  const chargerDonnees = useCallback(async () => {
    setLoading(true);

    try {
      const [categoriesRes, famillesRes] = await Promise.all([
        adminData<Category[]>("categories", "select", { order: "ordre" }),
        adminData<Family[]>("famille", "select", { order: "famille" }),
      ]);
      setCategories(categoriesRes || []);
      setFamilles(famillesRes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => { void chargerDonnees(); }, 0);
    return () => window.clearTimeout(task);
  }, [chargerDonnees]);

  async function creerArticle(data: ArticleFormData) {
    try {
      const articles = await adminData<CreatedArticle[]>("catalogue", "insert", { values: data });
      const nouvelArticle = articles?.[0];
      if (!nouvelArticle) throw new Error("Article non créé.");
      router.push(`/admin/articles/${nouvelArticle.id}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de l'article.");
      return;
    }
  }

  if (loading) {
    return (
      <div className="p-10">
        Chargement...
      </div>
    );
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
        article={null}
        categories={categories}
        familles={familles}
        onSave={creerArticle}
      />

    </main>
  );
}
