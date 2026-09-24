"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminData } from "@/lib/admin-api";

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

    const [articles, categoriesRes, famillesRes] = await Promise.all([
      adminData<any[]>("catalogue", "select", { filters: [{ column: "id", value: Number(id) }] }),
      adminData<any[]>("categories", "select", { order: "ordre" }),
      adminData<any[]>("famille", "select", { order: "famille" }),
    ]);
    const articleRes = articles?.[0];
    if (!articleRes) {
      router.push("/admin/articles/nouveau");
      return;
    }

    setArticle(articleRes);
    setCategories(categoriesRes || []);
    setFamilles(famillesRes || []);

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
    try {
      await adminData("catalogue", "update", { values: data, filters: [{ column: "id", value: Number(id) }] });
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
      return;
    }
  
    alert("Article enregistré.");
    chargerDonnees();
  }

  async function supprimerArticle() {
    if (!confirm("Supprimer cet article ?")) return;
  
    try {
      await adminData("catalogue", "delete", { values: {}, filters: [{ column: "id", value: Number(id) }] });
    } catch (error) {
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
