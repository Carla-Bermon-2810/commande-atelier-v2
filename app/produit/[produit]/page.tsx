import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";

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
    return <h1>Erreur de chargement</h1>;
  }

  if (!variantes || variantes.length === 0) {
    return <h1>Produit introuvable</h1>;
  }

  const photo = variantes.find(v => v.photo)?.photo;

  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="mx-auto max-w-7xl p-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* PHOTO */}

          <div className="rounded-2xl bg-white p-8 shadow">

            {photo ? (
              <img
                src={photo}
                alt={nomProduit}
                className="w-full object-contain"
              />
            ) : (
              <div className="flex h-96 items-center justify-center text-8xl">
                📦
              </div>
            )}

          </div>

          {/* PRODUIT */}

          <div className="rounded-2xl bg-white p-8 shadow">

            <h1 className="text-3xl font-bold">
              {nomProduit}
            </h1>

            <h2 className="mt-8 mb-4 text-xl font-semibold">
              Variantes disponibles
            </h2>

            <div className="space-y-3">

              {variantes.map((v) => (

                <button
                  key={v.id}
                  className="w-full rounded-xl border p-4 text-left hover:border-blue-600 hover:bg-blue-50"
                >
                  {v.article}
                </button>

              ))}

            </div>

          </div>

          {/* PANIER */}

          <div className="rounded-2xl bg-white p-8 shadow">

            <h2 className="text-xl font-bold">
              Quantité
            </h2>

            <div className="mt-6 flex items-center justify-center gap-5">

              <button className="rounded-lg border px-4 py-2">
                -
              </button>

              <span className="text-2xl">
                1
              </span>

              <button className="rounded-lg border px-4 py-2">
                +
              </button>

            </div>

            <button className="mt-10 w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white hover:bg-blue-700">
              Ajouter au panier
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}