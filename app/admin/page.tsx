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
      <div className="mx-auto max-w-7xl py-4">

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">Espace de gestion</p>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-50 text-[#F95516]"><Boxes size={24} /></div>
            <div>
              <h1 className="text-2xl font-bold text-[#17232b] sm:text-3xl">Administration</h1>
              <p className="mt-1 text-slate-500">Gérez les références, catégories et familles du catalogue.</p>
            </div>
          </div>
        </section>

        <div className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {cartes.map((carte) => {
            const Icon = carte.icon;

            return (
              <button
                key={carte.id}
                onClick={() => setOnglet(carte.id)}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-1 ${
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

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {onglet === "articles" && <Articles />}
          {onglet === "categories" && <Categories />}
          {onglet === "familles" && <Familles />}
        </div>

      </div>
    </AppLayout>
  );
}
