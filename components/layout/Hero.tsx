import { Boxes, Layers3, ShoppingCart } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[22rem] overflow-hidden rounded-2xl border border-slate-800 bg-[#10191e] sm:min-h-[25rem] sm:rounded-3xl">
      <div
        className="absolute inset-0 bg-cover bg-[center_right]"
        style={{ backgroundImage: "url('/hero-atelier-v3.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,21,.97)_0%,rgba(10,22,29,.9)_40%,rgba(9,18,23,.32)_70%,rgba(9,18,23,.08)_100%)]" />
      <div className="relative z-10 flex min-h-[22rem] max-w-3xl flex-col justify-center px-5 py-7 text-white sm:min-h-[25rem] sm:px-10 sm:py-10 lg:px-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#d98257] sm:text-sm">
          Catalogue interne
        </p>

        <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Commande Atelier
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
          Retrouvez rapidement une référence, un produit ou une famille grâce au moteur de recherche.
        </p>
        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-100 sm:mt-9">
          <div className="flex items-center gap-2"><Boxes size={19} className="text-[#d98257]" /><span>Catalogue à jour</span></div>
          <div className="flex items-center gap-2"><Layers3 size={19} className="text-[#d98257]" /><span>Stock suivi</span></div>
          <div className="flex items-center gap-2"><ShoppingCart size={19} className="text-[#d98257]" /><span>Commande rapide</span></div>
        </div>
      </div>
    </section>
  );
}
