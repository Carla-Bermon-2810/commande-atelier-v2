import { Boxes, Layers3, ShoppingCart } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[17rem] overflow-hidden rounded-2xl border border-slate-800 bg-[#10191e] sm:min-h-[20rem] lg:min-h-[20rem] lg:rounded-none lg:border-x-0">
      <div
        className="absolute inset-0 bg-cover bg-[right_56%]"
        style={{ backgroundImage: "url('/hero-atelier-v3.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,16,21,.97)_0%,rgba(10,22,29,.9)_40%,rgba(9,18,23,.32)_70%,rgba(9,18,23,.08)_100%)]" />
      <div className="relative z-10 flex min-h-[17rem] max-w-3xl flex-col justify-center px-5 py-7 text-white sm:min-h-[20rem] sm:px-10 sm:py-8 lg:min-h-[20rem] lg:px-10 lg:py-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#ff8d5c] sm:text-sm">
          Catalogue interne
        </p>

        <h1 className="max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.9rem]">
          Commande Atelier
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
          Retrouvez rapidement une référence, un produit ou une famille grâce au moteur de recherche.
        </p>
        <div className="mt-5 flex flex-wrap gap-y-3 text-xs text-slate-100 sm:mt-6 sm:text-sm">
          <div className="flex items-center gap-2 pr-5"><Boxes size={19} className="text-[#f15a24]" /><span>Catalogue<br className="lg:hidden" /> à jour</span></div>
          <div className="flex items-center gap-2 border-l border-white/30 px-5"><Layers3 size={19} className="text-[#f15a24]" /><span>Stock en temps réel</span></div>
          <div className="flex items-center gap-2 border-l border-white/30 pl-5"><ShoppingCart size={19} className="text-[#f15a24]" /><span>Demande simple<br className="lg:hidden" /> et rapide</span></div>
        </div>
      </div>
    </section>
  );
}
