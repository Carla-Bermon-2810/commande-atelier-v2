import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import ProductDetails from "@/components/catalogue/ProductDetails";

interface Props {
  params: Promise<{
    produit: string;
  }>;
}

export default async function ProduitPage({ params }: Props) {
  const { produit } = await params;

  const nomProduit = decodeURIComponent(produit);

  const { data: variantes, error } = await supabase
    .from("catalogue")
    .select("*")
    .eq("produit", nomProduit);

  if (error) {
    console.error(error);

    return (
      <AppLayout>
        <div className="p-6">
          <h1 className="text-xl font-bold">
            Erreur de chargement
          </h1>
        </div>
      </AppLayout>
    );
  }

  if (!variantes || variantes.length === 0) {
    return (
      <AppLayout>
        <div className="p-6">
          <h1 className="text-xl font-bold">
            Produit introuvable
          </h1>
        </div>
      </AppLayout>
    );
  }

  // On récupère la première variante avec une photo
  const varianteAvecPhoto = variantes.find((v) => v.photo);

  const cheminPhoto = varianteAvecPhoto?.photo ?? null;
  const photo = cheminPhoto
    ? cheminPhoto.startsWith("http") ? cheminPhoto : supabase.storage.from("photos").getPublicUrl(cheminPhoto).data.publicUrl
    : null;

  const produitDetails = {
    produit: nomProduit,
    famille: variantes[0].famille ?? "",
    photo,
    variants: variantes.map((variante) => ({
      catalogueId: variante.id,
      dimension: variante.dimension ?? null,
      grain: variante.grain ?? null,
    })),
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl py-4">
      <ProductDetails produit={produitDetails} />
      </div>
    </AppLayout>
  );
}
