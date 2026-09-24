"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

import Articles from "@/components/admin/Articles";
import Categories from "@/components/admin/Categories";
import Familles from "@/components/admin/Familles";

import {
  Boxes,
  Package,
  FolderTree,
  LayoutGrid,
} from "lucide-react";

export default function AdminPage() {
  const [onglet, setOnglet] = useState("articles");

  const cartes = [
    {
      id: "articles",
      titre: "Articles",
      icon: Package,
    },
    {
      id: "categories",
      titre: "Catégories",
      icon: FolderTree,
    },
    {
      id: "familles",
      titre: "Familles",
      icon: LayoutGrid,
    },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl p-5">

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Espace de gestion</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><Boxes size={27} /></div>
            <div>
              <h1 className="text-3xl font-bold text-[#2F3437]">Administration</h1>
              <p className="mt-1 text-slate-500">Gérez les références, catégories et familles du catalogue.</p>
            </div>
          </div>
        </section>

        <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {cartes.map((carte) => {
            const Icon = carte.icon;

            return (
              <button
                key={carte.id}
                onClick={() => setOnglet(carte.id)}
                className={`flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-5 py-3 font-medium transition focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-1 ${
                  onglet === carte.id
                    ? "bg-[#F95516] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                {carte.titre}
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          {onglet === "articles" && <Articles />}
          {onglet === "categories" && <Categories />}
          {onglet === "familles" && <Familles />}
        </div>

      </div>
    </AppLayout>
  );
}
