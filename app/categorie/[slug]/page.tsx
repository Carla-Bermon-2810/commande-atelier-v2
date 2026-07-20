import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getFamille } from "@/lib/catalogue";
import Navbar from "@/components/Navbar";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoriePage({ params }: PageProps) {
  const { slug } = await params;

  // Recherche de la catégorie
  const { data: categorie } = await supabase
    .from("categories")
    .select("nom")
    .eq("slug", slug)
    .single();

  if (!categorie) {
    return <h1>Catégorie introuvable</h1>;
  }

  // Récupération des familles
  const famille = await getFamille(categorie.nom);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <Navbar />
        <h1 className="mb-10 text-4xl font-bold">
          {categorie.nom}
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {famille.map((famille) => (
            <Link
              key={famille.id}
              href={`/categorie/${slug}/${encodeURIComponent(famille.famille)}`}
            >
              <div className="overflow-hidden rounded-2xl border bg-white shadow-md transition hover:scale-105 hover:shadow-xl">

                <div className="flex h-48 items-center justify-center bg-gray-200">
                  {famille.photo ? (
                    <img
                      src={famille.photo}
                      alt={famille.famille}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">📦</span>
                  )}
                </div>

                <div className="p-6">
                  <h2 className="text-center text-xl font-semibold">
                    {famille.famille}
                  </h2>
                </div>

              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}