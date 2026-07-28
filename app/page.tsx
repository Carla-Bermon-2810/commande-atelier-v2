import AppLayout from "@/components/layout/AppLayout";
import Hero from "@/components/layout/Hero";
import CategoryCard from "@/components/catalogue/CategoryCard";
import { supabase } from "@/lib/supabase";

import {
  Disc3,
  Scissors,
  Flame,
  Package,
  Wrench,
  ShieldCheck,
} from "lucide-react";

export default async function Home() {
  const { data: categories } = await supabase
  .from("categories")
  .select("*")
  .order("ordre");

  const { data: catalogue } = await supabase
  .from("catalogue")
  .select("categorie");

  const articleCount: Record<string, number> = {};

catalogue?.forEach((article) => {
  const categorie = article.categorie?.trim().toLowerCase();

  if (!categorie) return;

  articleCount[categorie] = (articleCount[categorie] || 0) + 1;
});

  return (
    <AppLayout>
      <Hero />
      <div
        className={`mt-1 grid gap-6 ${
          categories && categories.length <= 4
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {categories?.map((categorie) => (
          <CategoryCard
            key={categorie.id}
            icon={categorie.nom.toLowerCase()}
            title={categorie.nom}
            href={`/categorie/${categorie.slug}`}
            count={articleCount[categorie.nom.toLowerCase()] ?? 0}
          />
        ))}
      </div>
    </AppLayout>
  );
}