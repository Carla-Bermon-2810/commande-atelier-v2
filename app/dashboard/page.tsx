import Link from "next/link";
import { ArrowUpRight, Boxes, ClipboardList, PackageSearch, Settings } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const actions = [
  { href: "/", title: "Catalogue", description: "Rechercher une référence et préparer une commande.", icon: PackageSearch },
  { href: "/stock", title: "Stock atelier", description: "Consulter et ajuster les niveaux de stock.", icon: Boxes },
  { href: "/admin", title: "Administration", description: "Mettre à jour les références, catégories et familles.", icon: Settings },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <main className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Commande Atelier</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><ClipboardList size={27} /></div>
            <div><h1 className="text-3xl font-bold text-[#2F3437]">Centre de gestion</h1><p className="mt-1 text-slate-500">Choisissez l’espace adapté à votre tâche du moment.</p></div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return <Link key={action.href} href={action.href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2">
              <div className="flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><Icon size={25} /></div><ArrowUpRight className="text-slate-300 transition group-hover:text-[#F95516]" /></div>
              <h2 className="mt-6 text-xl font-bold text-[#2F3437]">{action.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{action.description}</p>
              <p className="mt-6 border-t border-slate-100 pt-4 text-sm font-bold text-[#F95516]">Ouvrir</p>
            </Link>;
          })}
        </div>
      </main>
    </AppLayout>
  );
}
