import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import ArticleCard from "@/components/ArticleCard";

interface PageProps {
  params: Promise<{
    slug: string;
    famille: string;
  }>;
}

export default async function FamillePage({ params }: PageProps) {
  const { slug, famille } = await params;

  // Recherche de la catégorie
  const { data: categorie } = await supabase
    .from("categories")
    .select("nom")
    .eq("slug", slug)
    .single();

  if (!categorie) {
    return <h1>Catégorie introuvable</h1>;
  }

  const familleNom = decodeURIComponent(famille);

  // Récupération des articles
  const { data: articles, error } = await supabase
    .from("catalogue")
    .select("*")
    .eq("categorie", categorie.nom.toUpperCase())
    .eq("famille", familleNom);

  if (error) {
    console.error(error);
    return <h1>Erreur lors du chargement des articles</h1>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <Navbar />

        <h1 className="mb-2 text-4xl font-bold">
          {familleNom}
        </h1>

        <p className="mb-8 text-gray-500">
          {articles?.length ?? 0} article(s)
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles?.map((article) => (
            <ArticleCard
              key={article.article}
              article={article}
            />
          ))}
        </div>
      </div>
    </main>
  );
}