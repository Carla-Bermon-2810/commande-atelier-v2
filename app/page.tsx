import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import { supabase } from "@/lib/supabase";

const icons: Record<string, string> = {
  package: "📦",
  scissors: "✂️",
  flame: "🔥",
  box: "📋",
};

export default async function Home() {
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("ordre");

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">

        <Header />

        <div className="mt-10 flex justify-center">
          <SearchBar />
        </div>

        <div
          className={`mt-14 grid gap-8 ${
            categories && categories.length <= 4
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >

          {categories?.map((categorie) => (
            <CategoryCard
              key={categorie.id}
              icon={icons[categorie.icone] ?? "📦"}
              title={categorie.nom}
              href={`/categorie/${categorie.slug}`}
            />
          ))}

        </div>

      </div>
    </main>
  );
}