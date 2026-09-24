"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminData } from "@/lib/admin-api";

import ArticleForm from "@/components/admin/ArticleForm";

export default function NouveauArticlePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<any[]>([]);
  const [familles, setFamilles] = useState<any[]>([]);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setLoading(true);

    const [categoriesRes, famillesRes] = await Promise.all([
      adminData<any[]>("categories", "select", { order: "ordre" }),
      adminData<any[]>("famille", "select", { order: "famille" }),
    ]);
    setCategories(categoriesRes || []);
    setFamilles(famillesRes || []);

    setLoading(false);
  }

  async function creerArticle(data: any) {
    try {
      const articles = await adminData<any[]>("catalogue", "insert", { values: data });
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
