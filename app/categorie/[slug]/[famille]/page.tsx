import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Layers } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { categoryImage } from "@/lib/category-visuals";
import FamilyProductGrid from "@/components/catalogue/FamilyProductGrid";
import { variantsUniques } from "@/components/catalogue/product-variants";
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
    .ilike("categorie", categorie.nom)
    .ilike("famille", familleNom)
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

  // Une fiche par produit : les formats et grains deviennent des variantes.
const groupes = new Map<string, {
  produit: string;
  famille: string;
  photo: string | null;
  variants: { dimension?: string | null; grain?: string | null }[];
}>();

(data ?? []).forEach((p) => {
  let photo: string | null = null;

  if (p.photo) {
    const { data: image } = supabase.storage
      .from("photos")
      .getPublicUrl(p.photo);

    photo = image.publicUrl;
  }

const produit = p.produit.trim().replace(/\s+/g, " ");
const cle = produit.toLocaleUpperCase("fr");
  if (!groupes.has(cle)) {
    groupes.set(cle, {
      produit,
      famille: p.famille,
      photo,
      variants: [],
    });
  }

  const groupe = groupes.get(cle)!;
  if (!groupe.photo && photo) groupe.photo = photo;
  groupe.variants.push({ dimension: p.dimension, grain: p.grain });
});

const produits = Array.from(groupes.values()).map((produit) => ({
  ...produit,
  variants: variantsUniques(produit.variants),
}));

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-2">
                <Link
                  href={`/categorie/${slug}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-[#F95516] hover:bg-orange-50 hover:text-[#F95516]"
                >
                  <ArrowLeft size={18} />
                  Retour
                </Link>
            </div>

        <section className="relative mb-5 overflow-hidden rounded-xl bg-[#142026] text-white">
          <Image src={categoryImage(categorie.nom)} alt="" fill sizes="(min-width: 1024px) 85vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,22,28,.97),rgba(12,22,28,.72)_55%,rgba(12,22,28,.1))]" />
          <div className="relative flex min-h-44 flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8d5c]">Catalogue › {categorie.nom}</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{familleNom}</h1>
            <p className="mt-2 text-sm text-slate-200">Choisissez la variante adaptée dans chaque fiche produit.</p>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold"><Layers size={15} />{produits.length} produit{produits.length > 1 ? "s" : ""}</span>
          </div>
        </section>

        <FamilyProductGrid produits={produits} />

      </div>
    </AppLayout>
  );
}
