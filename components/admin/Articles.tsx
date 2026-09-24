"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageOff, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { adminData } from "@/lib/admin-api";
import { supabase } from "@/lib/supabase";

type Article = {
  id: number;
  produit: string;
  categorie?: string | null;
  famille?: string | null;
  grain?: string | null;
  dimension?: string | null;
  photo?: string | null;
};
type Categorie = { id: number; nom: string };
type Famille = { id: number; categorie?: string | null; famille: string };

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [recherche, setRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [filtreFamille, setFiltreFamille] = useState("");
  const [filtrePhoto, setFiltrePhoto] = useState("tous");

  useEffect(() => {
    // Les mêmes données et filtres que l'ancienne vue, sans écriture en base.
    Promise.allSettled([
      adminData<Article[]>("catalogue", "select", { order: "produit" }),
      adminData<Categorie[]>("categories", "select", { order: "ordre" }),
      adminData<Famille[]>("famille", "select", { order: "famille" }),
    ]).then(([listeArticles, listeCategories, listeFamilles]) => {
      if (listeArticles.status === "fulfilled") setArticles(listeArticles.value ?? []);
      else console.error("Erreur articles :", listeArticles.reason);
      if (listeCategories.status === "fulfilled") setCategories(listeCategories.value ?? []);
      else console.error("Erreur catégories :", listeCategories.reason);
      if (listeFamilles.status === "fulfilled") setFamilles(listeFamilles.value ?? []);
      else console.error("Erreur familles :", listeFamilles.reason);
    });
  }, []);

  const famillesFiltrees = familles.filter((famille) => !filtreCategorie ||
    famille.categorie?.trim().toLowerCase() === filtreCategorie.trim().toLowerCase());
  const articlesFiltres = articles.filter((article) => {
    const texte = [article.produit, article.categorie, article.famille, article.grain, article.dimension]
      .filter(Boolean).join(" ").toLowerCase();
    const avecPhoto = Boolean(article.photo?.trim());
    return texte.includes(recherche.toLowerCase()) &&
      (!filtreCategorie || article.categorie?.trim().toLowerCase() === filtreCategorie.trim().toLowerCase()) &&
      (!filtreFamille || article.famille?.trim().toLowerCase() === filtreFamille.trim().toLowerCase()) &&
      (filtrePhoto === "tous" || (filtrePhoto === "avec" ? avecPhoto : !avecPhoto));
  });

  return (
    <section aria-label="Gestion des articles">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Gestion des articles</h2><p className="mt-1 text-sm text-slate-500">Ajoutez ou modifiez les références du catalogue.</p></div>
        <Link href="/admin/articles/nouveau" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#F95516] px-4 text-sm font-bold text-white hover:bg-[#e04d13]"><Plus size={18} /> Nouvel article</Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
          <Search size={18} aria-hidden="true" /><span className="sr-only">Rechercher un article</span>
          <input type="search" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher un article ou une référence..." className="w-full bg-transparent text-sm outline-none" />
        </label>
        <SlidersHorizontal size={18} className="hidden text-slate-400 sm:block" aria-hidden="true" />
        <select aria-label="Catégorie" value={filtreCategorie} onChange={(event) => { setFiltreCategorie(event.target.value); setFiltreFamille(""); }} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Toutes les catégories</option>{categories.map((categorie) => <option key={categorie.id} value={categorie.nom}>{categorie.nom}</option>)}</select>
        <select aria-label="Famille" value={filtreFamille} onChange={(event) => setFiltreFamille(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">Toutes les familles</option>{famillesFiltrees.map((famille) => <option key={famille.id} value={famille.famille}>{famille.famille}</option>)}</select>
        <select aria-label="Photos" value={filtrePhoto} onChange={(event) => setFiltrePhoto(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="tous">Toutes les photos</option><option value="avec">Avec photo</option><option value="sans">Sans photo</option></select>
      </div>

      <p className="my-3 text-xs font-medium text-slate-500">{articlesFiltres.length} référence{articlesFiltres.length > 1 ? "s" : ""}</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500"><tr><th className="px-4 py-3">Article</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Famille</th><th className="px-4 py-3">Variante</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {articlesFiltres.map((article) => {
              const photo = article.photo ? supabase.storage.from("photos").getPublicUrl(article.photo).data.publicUrl : null;
              return <tr key={article.id} className="hover:bg-orange-50/40">
                <td className="px-4 py-2"><div className="flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA]">{photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="max-h-11 max-w-11 object-contain" />
                ) : <ImageOff size={20} className="text-slate-300" />}</span><span className="font-semibold text-[#17232b]">{article.produit}</span></div></td>
                <td className="px-4 py-2 text-slate-600">{article.categorie || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{article.famille || "—"}</td>
                <td className="px-4 py-2 text-slate-600">{[article.grain, article.dimension].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-4 py-2 text-right"><Link href={`/admin/articles/${article.id}`} aria-label={`Modifier ${article.produit}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-orange-50 hover:text-[#F95516]"><Pencil size={17} /></Link></td>
              </tr>;
            })}
          </tbody>
        </table>
        {articlesFiltres.length === 0 && <p className="p-8 text-center text-slate-500">Aucun article trouvé.</p>}
      </div>
    </section>
  );
}
