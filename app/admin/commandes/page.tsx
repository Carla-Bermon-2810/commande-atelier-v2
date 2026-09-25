import { getServerSupabase } from "@/lib/supabase-server";
import { requireAdminAccess } from "@/lib/admin-auth";
import AppLayout from "@/components/layout/AppLayout";
import ContextBanner from "@/components/layout/ContextBanner";
import Link from "next/link";
import { supprimerCommande } from "./actions";
import { Trash2, Eye } from "lucide-react";

export default async function CommandesPage() {
  await requireAdminAccess();
  const supabase = getServerSupabase();
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
      <div className="mx-auto max-w-7xl p-5 lg:p-8">
        <ContextBanner
          eyebrow="Administration › Commandes"
          title="Mes demandes"
          description="Retrouvez l’historique et le suivi des demandes atelier."
          image="/category-soudure-v1.png"
          meta={`${commandes?.length ?? 0} demande${(commandes?.length ?? 0) > 1 ? "s" : ""}`}
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">

          <table className="w-full">

            <thead className="bg-slate-50 text-sm text-slate-500">

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
                  className="border-t border-slate-100 hover:bg-slate-50"
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
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/commandes/${commande.id}`}
                        title="Voir"
                        className="rounded-lg bg-[#f15a24] p-3 text-white transition hover:bg-[#d84b1a]"
                      >
                        <Eye size={20} />
                      </Link>

                      <form action={supprimerCommande}>
                        <input
                          type="hidden"
                          name="id"
                          value={commande.id}
                        />

                        <button
                          type="submit"
                          title="Supprimer"
                          className="rounded-lg bg-red-600 p-3 text-white transition hover:bg-red-1000"
                        >
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </div>
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
