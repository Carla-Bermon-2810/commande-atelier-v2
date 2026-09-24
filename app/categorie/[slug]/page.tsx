import Link from "next/link";
import { ArrowRight, Boxes, FolderOpen, ArrowLeft, PackageSearch } from "lucide-react";
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

        <section className="mb-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Catalogue · {categorie.nom}</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><Boxes size={27} /></div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2F3437] sm:text-4xl">{categorie.nom}</h1>
                  <p className="mt-1 text-slate-500">Choisissez une famille, puis sélectionnez la référence adaptée.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2"><FolderOpen size={17} className="text-[#F95516]" />{familles?.length ?? 0} familles</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2"><PackageSearch size={17} className="text-[#F95516]" />{nbReferences ?? 0} références</span>
            </div>
          </div>
          <p className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600 sm:px-8">Les variantes de format, diamètre ou grain se choisissent dans la fiche produit.</p>
        </section>

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
