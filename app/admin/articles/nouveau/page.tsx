"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      supabase
        .from("categories")
        .select("*")
        .order("ordre"),

      supabase
        .from("famille")
        .select("*")
        .order("famille"),
    ]);

    setCategories(categoriesRes.data || []);
    setFamilles(famillesRes.data || []);

    setLoading(false);
  }

  async function creerArticle(data: any) {
    const { data: nouvelArticle, error } = await supabase
      .from("catalogue")
      .insert(data)
      .select()
      .single();
  
    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }
  
    router.push(`/admin/articles/${nouvelArticle.id}`);
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