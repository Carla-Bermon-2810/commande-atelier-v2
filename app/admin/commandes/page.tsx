import { getServerSupabase } from "@/lib/supabase-server";
import { requireAdminAccess } from "@/lib/admin-auth";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import { supprimerCommande } from "./actions";
import { Trash2, Eye, ClipboardList } from "lucide-react";

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
      <div className="mx-auto max-w-7xl py-4">
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#F95516]">Suivi des demandes</p>
          <div className="mt-2 flex items-center gap-3"><ClipboardList className="text-[#F95516]" size={25} /><h1 className="text-2xl font-bold sm:text-3xl">Commandes</h1></div>
          <p className="mt-2 text-sm text-slate-500">Retrouvez les demandes enregistrées et leur état actuel.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">

              <tr>

                <th className="px-4 py-3 text-left">
                  Demandeur
                </th>

                <th className="px-4 py-3 text-left">
                  Statut
                </th>

                <th className="px-4 py-3 text-left">
                  Date
                </th>

                <th className="px-4 py-3 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {commandes?.map((commande) => (

                <tr
                  key={commande.id}
                  className="border-t border-slate-100 hover:bg-orange-50/40"
                >

                  <td className="px-4 py-3 font-semibold">
                    {commande.demandeur}
                  </td>

                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{commande.statut}</span>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {new Date(
                      commande.date_commande
                    ).toLocaleString("fr-FR")}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/commandes/${commande.id}`}
                        title="Voir"
                        className="rounded-lg bg-orange-50 p-2.5 text-[#F95516] transition hover:bg-orange-100"
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
                          className="rounded-lg bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100"
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
