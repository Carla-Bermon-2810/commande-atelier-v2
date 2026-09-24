import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FolderOpen, ArrowLeft, PackageSearch, ImageOff } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { categoryImage } from "@/lib/category-visuals";
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
    .select("famille, photo", {
      count: "exact",
    })
    .ilike("categorie", categorie.nom);

  // Nombre de références par famille
  const compteurFamille: Record<string, number> = {};
  const photosFamille: Record<string, string> = {};

  catalogue?.forEach((article) => {
    compteurFamille[article.famille] =
      (compteurFamille[article.famille] || 0) + 1;
    if (article.photo && !photosFamille[article.famille]) {
      photosFamille[article.famille] = supabase.storage.from("photos").getPublicUrl(article.photo).data.publicUrl;
    }
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

        <section className="relative mb-6 overflow-hidden rounded-xl bg-[#142026] text-white">
          <Image src={categoryImage(categorie.nom)} alt="" fill sizes="(min-width: 1024px) 85vw, 100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,22,28,.97),rgba(12,22,28,.75)_48%,rgba(12,22,28,.12))]" />
          <div className="relative flex min-h-48 flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8d5c]">Catalogue · {categorie.nom}</p>
            <h1 className="mt-2 text-3xl font-black uppercase text-white sm:text-4xl">{categorie.nom}</h1>
            <p className="mt-2 text-sm text-slate-200">Choisissez une famille pour voir ses produits.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><FolderOpen size={15} />{familles?.length ?? 0} familles</span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2"><PackageSearch size={15} />{nbReferences ?? 0} références</span>
            </div>
          </div>
        </section>

        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Familles</h2><span className="text-sm text-slate-500">{familles?.length ?? 0} familles</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {familles?.map((famille) => (

            <Link
              key={famille.id}
              href={`/categorie/${slug}/${encodeURIComponent(
                famille.famille
              )}`}
              className="group flex min-h-44 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F95516] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2"
            >
              <div className="flex h-28 items-center justify-center border-b border-slate-100 bg-[#F8F9FA] p-3">
                {photosFamille[famille.famille] ? (
                  // Les photos réelles proviennent du catalogue Supabase.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photosFamille[famille.famille]} alt="" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
                ) : <ImageOff size={35} className="text-slate-300" />}
              </div>
              <div className="flex flex-1 items-end justify-between gap-3 p-4">
                <div><h3 className="font-bold text-[#17232b]">{famille.famille}</h3><p className="mt-1 text-xs text-slate-500">
                  {compteurFamille[famille.famille] ?? 0} référence
                  {(compteurFamille[famille.famille] ?? 0) > 1 ? "s" : ""}
                </p></div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F95516] text-white group-hover:translate-x-0.5"><ArrowRight size={18} /></span>
              </div>
            </Link>

          ))}

        </div>

      </div>
    </AppLayout>
  );
}
