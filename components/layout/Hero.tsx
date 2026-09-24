import { Boxes, Layers3, ShoppingCart } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[22rem] overflow-hidden rounded-2xl border border-slate-800 bg-[#10191e] sm:min-h-[25rem] sm:rounded-3xl lg:min-h-[19.2rem] lg:rounded-none lg:border-x-0">
      <div
        className="absolute inset-0 bg-cover bg-[center_right]"
        style={{ backgroundImage: "url('/hero-atelier-v3.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,21,.97)_0%,rgba(10,22,29,.9)_40%,rgba(9,18,23,.32)_70%,rgba(9,18,23,.08)_100%)]" />
      <div className="relative z-10 flex min-h-[22rem] max-w-3xl flex-col justify-center px-5 py-7 text-white sm:min-h-[25rem] sm:px-10 sm:py-10 lg:min-h-[19.2rem] lg:px-14 lg:py-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#d98257] sm:text-sm">
          Catalogue interne
        </p>

        <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-[3.55rem]">
          Commande Atelier
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
          Retrouvez rapidement une référence, un produit ou une famille grâce au moteur de recherche.
        </p>
        <div className="mt-7 flex flex-wrap gap-y-3 text-sm text-slate-100 sm:mt-8">
          <div className="flex items-center gap-2 pr-5"><Boxes size={19} className="text-[#f15a24]" /><span>Catalogue<br className="lg:hidden" /> à jour</span></div>
          <div className="flex items-center gap-2 border-l border-white/30 px-5"><Layers3 size={19} className="text-[#f15a24]" /><span>Stock en temps réel</span></div>
          <div className="flex items-center gap-2 border-l border-white/30 pl-5"><ShoppingCart size={19} className="text-[#f15a24]" /><span>Demande simple<br className="lg:hidden" /> et rapide</span></div>
        </div>
      </div>
    </section>
  );
}
