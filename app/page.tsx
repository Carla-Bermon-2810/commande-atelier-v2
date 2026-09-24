import AppLayout from "@/components/layout/AppLayout";
import CatalogueClient from "@/components/catalogue/CatalogueClient";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function Home() {
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .order("ordre");

  const { data: catalogue, error: catalogueError } = await supabase
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

  if (categoriesError || catalogueError) {
    return (
      <AppLayout>
        <section className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">Connexion indisponible</p>
          <h1 className="mt-3 text-2xl font-bold text-[#2F3437] sm:text-3xl">Le catalogue ne peut pas être chargé.</h1>
          <p className="mt-3 text-slate-600">Vérifiez la connexion réseau, puis actualisez la page. Aucune donnée n’a été supprimée.</p>
          <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#F95516] px-5 font-semibold text-white hover:bg-[#e04d13]">Réessayer</Link>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CatalogueClient
        categories={categories ?? []}
        catalogue={catalogue ?? []}
      />
    </AppLayout>
  );
}
