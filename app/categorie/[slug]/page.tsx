import { supabase } from "@/lib/supabase";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoriePage({ params }: PageProps) {
  const { slug } = await params;

  // Recherche de la catégorie grâce au slug
  const { data: categorie } = await supabase
    .from("categories")
    .select("nom")
    .eq("slug", slug)
    .single();

  if (!categorie) {
    return <h1>Catégorie introuvable</h1>;
  }

  // Récupération des types
  const { data, error } = await supabase
    .from("catalogue")
    .select("type")
    .eq("categorie", categorie.nom.toUpperCase());

  if (error) {
    console.error(error);
  }

  // Suppression des doublons + suppression des espaces + tri
  const types = [
    ...new Set(
      data
        ?.map((item) => item.type?.trim().toUpperCase())
        .filter(Boolean)
    ),
  ].sort();

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-10 text-4xl font-bold">
          {categorie.nom}
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {types.map((type) => (
            <div
              key={type}
              className="cursor-pointer rounded-2xl border bg-white p-8 shadow-md transition hover:scale-105 hover:shadow-xl"
            >
              <h2 className="text-center text-xl font-semibold">
                {type}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}