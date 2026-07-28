import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/lib/supabase";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoriePage({ params }: PageProps) {
  const { slug } = await params;

  // Catégorie
  const { data: categorie } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!categorie) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold">Catégorie introuvable</h1>
      </AppLayout>
    );
  }

  // Familles
  const { data: familles, error } = await supabase
    .from("famille")
    .select("*")
    .eq("categorie", categorie.nom.toUpperCase())
    .order("ordre");

  if (error) {
    return (
      <AppLayout>
        <h1 className="text-2xl font-bold">
          Erreur lors du chargement
        </h1>
      </AppLayout>
    );
  }

  // Catalogue
  const { data: catalogue, count: nbReferences } = await supabase
    .from("catalogue")
    .select("famille", {
      count: "exact",
    })
    .eq("categorie", categorie.nom.toUpperCase());

  // Nombre de références par famille
  const compteurFamille: Record<string, number> = {};

  catalogue?.forEach((article) => {
    compteurFamille[article.famille] =
      (compteurFamille[article.famille] || 0) + 1;
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">

        {/* Hero */}

        <div className="mb-10 overflow-hidden rounded-3xl border bg-white p-8 shadow-sm">

          <p className="mb-3 text-sm text-slate-500">
            Accueil / {categorie.nom}
          </p>

          <h1 className="text-4xl font-bold text-slate-900">
            {categorie.nom}
          </h1>

          <div className="mt-6 flex gap-6 text-sm text-slate-500">

            <span>
              <strong className="text-slate-900">
                {familles?.length ?? 0}
              </strong>{" "}
              familles
            </span>

            <span>
              <strong className="text-slate-900">
                {nbReferences ?? 0}
              </strong>{" "}
              références
            </span>

          </div>

        </div>

        {/* Cartes */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {familles?.map((famille) => (

            <Link
              key={famille.id}
              href={`/categorie/${slug}/${encodeURIComponent(
                famille.famille
              )}`}
            >
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-xl">

                <div className="mb-6 flex items-start justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">

                    <FolderOpen size={28} />

                  </div>

                  <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />

                </div>

                <h2 className="text-xl font-semibold text-slate-800">
                  {famille.famille}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {compteurFamille[famille.famille] ?? 0} référence
                  {(compteurFamille[famille.famille] ?? 0) > 1 ? "s" : ""}
                </p>

              </div>
            </Link>

          ))}

        </div>

      </div>
    </AppLayout>
  );
}