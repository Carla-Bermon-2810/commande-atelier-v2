import Link from "next/link";
import { ArrowRight, FolderOpen, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ContextBanner from "@/components/layout/ContextBanner";
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
    .ilike("categorie", categorie.nom)
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
    .ilike("categorie", categorie.nom);

  // Nombre de références par famille
  const compteurFamille: Record<string, number> = {};

  catalogue?.forEach((article) => {
    compteurFamille[article.famille] =
      (compteurFamille[article.famille] || 0) + 1;
  });

  const categoryImages: Record<string, string> = {
    abrasif: "/category-abrasif-v1.png",
    "outils-de-coupe": "/category-outils-coupe-v1.png",
    "poste-soudure": "/category-soudure-v1.png",
    consommable: "/category-consommable-v1.png",
    quincaillerie: "/category-quincaillerie-v1.png",
    epi: "/category-epi-v1.png",
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
            <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#F95516] hover:text-[#F95516]"
        >
          <ArrowLeft size={18} />
          Retour
        </Link>
      </div>

        <ContextBanner
          eyebrow={`Catalogue › ${categorie.nom}`}
          title={categorie.nom}
          description="Choisissez une famille, puis sélectionnez la référence adaptée."
          image={categoryImages[slug] ?? "/hero-atelier-v3.png"}
          meta={<><span>{familles?.length ?? 0} familles</span><span className="mx-2 text-white/40">•</span><span>{nbReferences ?? 0} références</span></>}
        />

        {/* Cartes */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {familles?.map((famille) => (

            <Link
              key={famille.id}
              href={`/categorie/${slug}/${encodeURIComponent(
                famille.famille
              )}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F95516] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"
            >

                <div className="mb-6 flex items-start justify-between">

                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white">
                  <FolderOpen size={28} />
                </div>

                <ArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#F95516]" />

                </div>

                <h2 className="text-xl font-semibold text-slate-800">
                  {famille.famille}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {compteurFamille[famille.famille] ?? 0} référence
                  {(compteurFamille[famille.famille] ?? 0) > 1 ? "s" : ""}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-[#F95516]">
                  Voir les références
                  <span className="rounded-lg bg-orange-50 px-2 py-1 group-hover:bg-[#F95516] group-hover:text-white">→</span>
                </div>

            </Link>

          ))}

        </div>

      </div>
    </AppLayout>
  );
}
