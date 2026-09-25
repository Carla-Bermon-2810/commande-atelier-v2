import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FolderOpen, ArrowLeft, PackageSearch, ImageOff } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { categoryImage, familyImage } from "@/lib/category-visuals";
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
      <div className="mx-auto w-full max-w-[1420px]">
        <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#F95516] hover:text-[#F95516]"
        >
          <ArrowLeft size={18} />
          Retour
        </Link>
      </div>

        <section className="relative mb-5 overflow-hidden rounded-xl bg-[#142026] text-white shadow-sm">
          <Image src={categoryImage(categorie.nom)} alt="" fill sizes="(min-width: 1024px) 85vw, 100vw" className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,22,28,.98)_0%,rgba(12,22,28,.86)_23%,rgba(12,22,28,.57)_48%,rgba(12,22,28,.08)_100%)]" />
          <div className="relative flex min-h-[15.25rem] flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.19em] text-[#ff8d5c] sm:text-sm">Catalogue · {categorie.nom}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-[2.6rem]">{categorie.nom}</h1>
            <p className="mt-2 text-sm text-slate-100 sm:text-base">Choisissez une famille pour voir ses produits.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm"><FolderOpen size={16} aria-hidden="true" />{familles?.length ?? 0} familles</span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm"><PackageSearch size={16} aria-hidden="true" />{nbReferences ?? 0} références</span>
            </div>
          </div>
        </section>

        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#17232b] sm:text-2xl">Familles</h2><span className="text-sm text-slate-500">{familles?.length ?? 0} familles</span></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">

          {familles?.map((famille) => (

            <Link
              key={famille.id}
              href={`/categorie/${slug}/${encodeURIComponent(
                famille.famille
              )}`}
              className="group flex min-h-[11.75rem] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F95516] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F95516]"
            >
              <div className="flex h-28 items-center justify-center overflow-hidden border-b border-slate-100 bg-[#f1f3f5]">
                {(familyImage(categorie.nom, famille.famille) || famille.photo || photosFamille[famille.famille]) ? (
                  // Les photos réelles proviennent du catalogue Supabase.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={familyImage(categorie.nom, famille.famille) ?? (famille.photo ? supabase.storage.from("photos").getPublicUrl(famille.photo).data.publicUrl : photosFamille[famille.famille])} alt="" className="h-full w-full scale-150 object-cover transition-transform duration-300 group-hover:scale-[1.6]" />
                ) : <ImageOff size={35} className="text-slate-300" />}
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0"><h3 className="font-bold text-[#17232b]">{famille.famille}</h3><p className="mt-1 text-sm text-slate-500">
                  {compteurFamille[famille.famille] ?? 0} référence
                  {(compteurFamille[famille.famille] ?? 0) > 1 ? "s" : ""}
                </p></div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F95516] text-white transition-transform group-hover:translate-x-0.5"><ArrowRight size={20} aria-hidden="true" /></span>
              </div>
            </Link>

          ))}

        </div>

      </div>
    </AppLayout>
  );
}
