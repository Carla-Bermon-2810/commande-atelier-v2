export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#F8F9FA] px-4 py-6 sm:rounded-3xl sm:px-8 sm:py-8">
      {/* Décor */}

      <div className="absolute right-0 top-0 h-full w-80 overflow-hidden">
        <div className="absolute right-8 top-6 h-32 w-32 rotate-45 rounded-3xl border border-slate-300 opacity-30"></div>
        <div className="absolute right-28 top-32 h-20 w-20 rotate-45 rounded-2xl border border-slate-300 opacity-20"></div>
        <div className="absolute right-2 bottom-8 h-40 w-40 rotate-45 rounded-[40px] border border-[#1e4c5e]/20"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a55a36] sm:text-sm sm:tracking-[0.25em]">
          Catalogue interne
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-[#2F3437] sm:text-3xl md:text-4xl">
          COMMANDE ATELIER
        </h1>

        <p className="mx-auto mt-2 max-w-3xl text-base text-[#626B72] sm:text-lg">
          Retrouvez rapidement une référence, un produit ou une famille grâce au moteur de recherche.
        </p>

      </div>
    </section>
  );
}
