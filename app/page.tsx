import AppLayout from "@/components/layout/AppLayout";
import CatalogueClient from "@/components/catalogue/CatalogueClient";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("ordre");

  const { data: catalogue } = await supabase
    .from("catalogue")
    .select(`
      id,
      categorie,
      famille,
      produit,
      grain,
      dimension,
      photo
    `);

  return (
    <AppLayout>
      <CatalogueClient
        categories={categories ?? []}
        catalogue={catalogue ?? []}
      />
    </AppLayout>
  );
}