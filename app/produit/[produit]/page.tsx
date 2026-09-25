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
        <div className="mx-auto max-w-7xl py-4 lg:py-7">
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
        <div className="mx-auto max-w-7xl py-4 lg:py-7">
          <h1 className="text-xl font-bold">
            Produit introuvable
          </h1>
        </div>
      </AppLayout>
    );
  }

  // On récupère la première variante avec une photo
  const varianteAvecPhoto = variantes.find((v) => v.photo);

  const photo = varianteAvecPhoto?.photo ?? null;

  // Toutes les variantes de grain disponibles
  const grains = Array.from(
    new Set(
      variantes
        .map((v) => v.grain)
        .filter(Boolean)
    )
  ) as string[];

    const produitDetails = {
    produit: nomProduit,
    famille: variantes[0].famille ?? "",
    photo,
    dimension: variantes[0].dimension ?? null,
    grains,
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl py-4 lg:py-7">
        <ProductDetails produit={produitDetails} />
      </div>
    </AppLayout>
  );
}
