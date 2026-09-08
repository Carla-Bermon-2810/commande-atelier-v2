import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  Hexagon,
  Package,
  Wrench,
  Circle,
} from "lucide-react";

const categories = [
  {
    href: "/stock/tubes",
    title: "Tubes",
    description: "Tubes acier, inox et aluminium",
    icon: Package,
    image:
      "https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=1000&q=80",
  },
  {
    href: "/stock/tiges-filetees",
    title: "Tiges filetées",
    description: "Tiges filetées et barres filetées",
    icon: CircleDot,
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1000&q=80",
  },
  {
    href: "/stock/inserts",
    title: "Inserts",
    description: "Inserts et éléments de fixation",
    icon: Hexagon,
    image:
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    href: "/stock/vis",
    title: "Vis",
    description: "Visserie de l'atelier",
    icon: Wrench,
    image:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1000&q=80",
  },
  {
    href: "/stock/ecrous",
    title: "Écrous",
    description: "Écrous et éléments associés",
    icon: Circle,
    image:
      "https://images.unsplash.com/photo-1590774351574-6f4a1a8c5a7b?auto=format&fit=crop&w=1000&q=80",
  },
];

export default function StockPage() {
  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <Package size={34} className="text-[#F95516]" />
          <h1 className="text-4xl font-bold text-[#2F3437]">STOCK</h1>
        </div>
        <p className="mt-2 text-slate-500">
          Sélectionnez la famille de produits que vous souhaitez gérer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <Link
              key={category.href}
              href={category.href}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
            >
              <div className="relative h-56 overflow-hidden bg-slate-100">
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95 text-[#F95516] shadow-lg">
                  <Icon size={24} />
                </div>
              </div>

              <div className="flex items-center justify-between p-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#2F3437]">
                    {category.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {category.description}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F95516] transition group-hover:bg-[#F95516] group-hover:text-white">
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
