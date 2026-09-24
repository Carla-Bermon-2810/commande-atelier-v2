import { getServerSupabase } from "@/lib/supabase-server";
import { requireAdminAccess } from "@/lib/admin-auth";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default async function CommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAccess();
  const supabase = getServerSupabase();
  const { id } = await params;

  const { data: commande } = await supabase
    .from("commandes")
    .select("*")
    .eq("id", id)
    .single();

  const { data: articles } = await supabase
    .from("commande_articles")
    .select("*")
    .eq("commande_id", id);

  if (!commande) {
    return (
      <AppLayout>
        <p className="p-8">Commande introuvable.</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-8 p-8">

        <Link
          href="/admin/commandes"
          className="mb-6 inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ← Retour à l'historique
        </Link>

        <div className="rounded-2xl border bg-white p-8 shadow">

          <h1 className="mb-6 text-4xl font-bold">
            {commande.numero}
          </h1>

          <div className="grid grid-cols-2 gap-6">

            <div>
              <p className="text-gray-500">Demandeur</p>
              <p className="text-xl font-semibold">
                {commande.demandeur}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Statut</p>
              <p className="text-xl font-semibold">
                {commande.statut}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Date</p>
              <p>
                {new Date(
                  commande.date_commande
                ).toLocaleString("fr-FR")}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Commentaire</p>
              <p>{commande.commentaire}</p>
            </div>

          </div>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow">

          <h2 className="mb-6 text-2xl font-bold">
            Articles
          </h2>

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="py-3 text-left">
                  Article
                </th>

                <th className="py-3 text-left">
                  Quantité
                </th>

              </tr>

            </thead>

            <tbody>

              {articles?.map((a) => (

                <tr
                  key={a.id}
                  className="border-b"
                >

                  <td className="py-3">
                    {a.article}
                  </td>

                  <td className="py-3">
                    {a.quantite}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>
    </AppLayout>
  );
}
