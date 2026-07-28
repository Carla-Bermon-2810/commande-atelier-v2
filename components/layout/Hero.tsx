import SearchBar from "../catalogue/SearchBar";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#F8F9FA] px-8 py-12">

      {/* Décor */}
      <div className="absolute right-0 top-0 h-full w-80 overflow-hidden">
        <div className="absolute right-8 top-6 h-32 w-32 rotate-45 rounded-3xl border border-slate-300 opacity-30"></div>
        <div className="absolute right-28 top-32 h-20 w-20 rotate-45 rounded-2xl border border-slate-300 opacity-20"></div>
        <div className="absolute right-2 bottom-8 h-40 w-40 rotate-45 rounded-[40px] border border-[#F95516]/20"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#F95516]">
          Catalogue interne
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-[#2F3437]">
          COMMANDE ATELIER
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-[#626B72]">
          Retrouvez rapidement une référence, un produit ou une famille
          grâce au moteur de recherche.
        </p>

        <div className="mx-auto mt-8 max-w-2xl">
          <SearchBar />
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 text-[#626B72] shadow-sm border border-slate-200">
            M8x20
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-[#626B72] shadow-sm border border-slate-200">
            Disque zirconium
          </span>

          <span className="rounded-full bg-white px-4 py-2 text-[#626B72] shadow-sm border border-slate-200">
            Gants soudure
          </span>
        </div>

      </div>
    </section>
  );
}