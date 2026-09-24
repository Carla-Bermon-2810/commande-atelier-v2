import Link from "next/link";
import { ArrowLeft, Boxes, Layers } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
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

        <section className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Catalogue · {categorie.nom}</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><Boxes size={27} /></div>
                <div>
                  <h1 className="text-3xl font-bold text-[#2F3437] sm:text-4xl">{familleNom}</h1>
                  <p className="mt-1 text-slate-500">Choisissez une variante, puis ajoutez-la au panier.</p>
                </div>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"><Layers size={17} className="text-[#F95516]" />{produits.length} produit{produits.length > 1 ? "s" : ""}</span>
          </div>
          <p className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-sm text-slate-600 sm:px-8">Une carte correspond à un produit ; ses dimensions et grains sont regroupés dans une seule fiche.</p>
        </section>

        <FamilyProductGrid produits={produits} />

      </div>
    </AppLayout>
  );
}
