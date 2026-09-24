import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Boxes } from "lucide-react";
import BackButton from "@/components/layout/BackButton";

type StockFamilyItem = {
  href: string;
  title: string;
  image: string;
  detail: string;
};

type Props = {
  backHref: string;
  eyebrow: string;
  title: string;
  description: string;
  items: StockFamilyItem[];
};

export default function StockFamilySelector({ backHref, eyebrow, title, description, items }: Props) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
      <BackButton href={backHref} />
      <section className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F95516]">{eyebrow}</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#F95516]"><Boxes size={27} /></div>
              <div>
                <h1 className="text-3xl font-bold text-[#2F3437] sm:text-4xl">{title}</h1>
                <p className="mt-1 text-slate-500">{description}</p>
              </div>
            </div>
          </div>
          <span className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">{items.length} famille{items.length > 1 ? "s" : ""} disponible{items.length > 1 ? "s" : ""}</span>
        </div>
      </section>

      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${items.length > 3 ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2">
            <div className="relative h-56 overflow-hidden bg-slate-100">
              <Image src={item.image} alt={item.title} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#F95516]">Suivi atelier</p>
              <h2 className="mt-2 text-2xl font-bold text-[#2F3437]">{item.title}</h2>
              <p className="mt-2 min-h-10 text-sm text-slate-500">{item.detail}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-[#F95516]">Ouvrir le suivi<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 transition group-hover:bg-[#F95516] group-hover:text-white"><ArrowUpRight size={20} /></span></div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
