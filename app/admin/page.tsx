"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

import Articles from "@/components/admin/Articles";
import Categories from "@/components/admin/Categories";
import Familles from "@/components/admin/Familles";

import {
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

        <h1 className="mb-6 text-3xl font-bold text-[#2F3437]">
          ⚙️ Administration
        </h1>

        <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {cartes.map((carte) => {
            const Icon = carte.icon;

            return (
              <button
                key={carte.id}
                onClick={() => setOnglet(carte.id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition ${
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