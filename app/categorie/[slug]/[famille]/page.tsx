import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ProductCard from "@/components/catalogue/ProductCard";
import { supabase } from "@/lib/supabase";

interface PageProps {
  params: Promise<{
    slug: string;
    famille: string;
  }>;
}

export default async function FamillePage({ params }: PageProps) {
  const { slug, famille } = await params;

  const familleNom = decodeURIComponent(famille);

  const { data: categorie } = await supabase
    .from("categories")
    .select("nom")
    .eq("slug", slug)
    .single();

  if (!categorie) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold">Catégorie introuvable</h1>
      </AppLayout>
    );
  }

  const { data, error } = await supabase
    .from("catalogue")
    .select("produit, photo, dimension, grain, famille")
    .eq("categorie", categorie.nom.toUpperCase())
    .eq("famille", familleNom)
    .order("produit");

  if (error) {
    return (
      <AppLayout>
        <pre className="whitespace-pre-wrap p-6 text-red-600">
          {JSON.stringify(error, null, 2)}
        </pre>
      </AppLayout>
    );
  }

  // Conversion des chemins Storage en URL publiques
  const produits = [
    ...new Map(
      (data ?? []).map((p) => {
        let photo: string | null = null;

        if (p.photo) {
          const { data: image } = supabase.storage
            .from("photos")
            .getPublicUrl(p.photo);

          photo = image.publicUrl;
        }

        return [
          p.produit,
          {
            ...p,
            photo,
          },
        ];
      })
    ).values(),
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">

        {/* Hero */}

        <div className="mb-10 rounded-3xl border bg-white p-8 shadow-sm">

          <div className="mb-4">
            <Link
              href={`/categorie/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Retour à {categorie.nom}
            </Link>
          </div>

          <h1 className="text-4xl font-bold text-slate-900">
            {familleNom}
          </h1>

          <p className="mt-3 text-slate-600">
            Retrouvez rapidement le produit recherché.
          </p>

          <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
            <span>
              <strong className="text-slate-900">
                {produits.length}
              </strong>{" "}
              produit{produits.length > 1 ? "s" : ""}
            </span>
          </div>

        </div>

        {/* Recherche */}

        <div className="mb-10">
          <div className="flex items-center gap-3 rounded-2xl border bg-white px-5 py-4 shadow-sm">
            <Search
              className="text-slate-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Rechercher un produit..."
              className="w-full bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Produits */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produits.map((produit) => (
            <ProductCard
              key={produit.produit}
              produit={produit}
            />
          ))}
        </div>

      </div>
    </AppLayout>
  );
}