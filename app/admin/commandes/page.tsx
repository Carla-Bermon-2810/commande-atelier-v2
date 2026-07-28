import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default async function CommandesPage() {
  const { data: commandes, error } = await supabase
    .from("commandes")
    .select("*")
    .order("date_commande", { ascending: false });

  if (error) {
    return (
      <AppLayout>
        <p className="p-8 text-red-600">
          {error.message}
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl p-8">

        <h1 className="mb-8 text-4xl font-bold">
          📦 Commandes
        </h1>

        <div className="overflow-hidden rounded-2xl border bg-white shadow">

          <table className="w-full">

            <thead className="bg-slate-100">

              <tr>

                <th className="p-4 text-left">
                  Demandeur
                </th>

                <th className="p-4 text-left">
                  Statut
                </th>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {commandes?.map((commande) => (

                <tr
                  key={commande.id}
                  className="border-t hover:bg-slate-50"
                >

                  <td className="p-4">
                    {commande.demandeur}
                  </td>

                  <td className="p-4">
                    {commande.statut}
                  </td>

                  <td className="p-4">
                    {new Date(
                      commande.date_commande
                    ).toLocaleString("fr-FR")}
                  </td>

                  <td className="p-4">
                      <Link
                        href={`/admin/commandes/${commande.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                      >
                        Voir
                      </Link>
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