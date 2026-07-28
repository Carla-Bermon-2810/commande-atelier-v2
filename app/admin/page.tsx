"use client";

import { useState } from "react";
import Link from "next/link";
import Articles from "@/components/admin/Articles";
import Categories from "@/components/admin/Categories";
import Familles from "@/components/admin/Familles";

export default function AdminPage() {
  const [onglet, setOnglet] = useState("articles");

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl rounded-xl bg-white p-8 shadow">
        <h1 className="mb-8 text-3xl font-bold">
                <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
          >
            ← Retour à l'accueil
          </Link>
        </div>
          ⚙️ Administration
        </h1>

        <div className="mb-8 flex gap-3">
          <button onClick={() => setOnglet("articles")}>
            📦 Articles
          </button>

          <button onClick={() => setOnglet("categories")}>
            📁 Catégories
          </button>

          <button onClick={() => setOnglet("familles")}>
            🗂️ Familles
          </button>
        </div>

        {onglet === "articles" && <Articles />}
        {onglet === "categories" && <Categories />}
        {onglet === "familles" && <Familles />}
      </div>
    </main>
  );
}