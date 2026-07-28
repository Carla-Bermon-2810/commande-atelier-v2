import SearchBar from "../catalogue/SearchBar";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-50 via-white to-blue-50 px-10 py-16">

      {/* Motif décoratif */}
      <div className="absolute right-0 top-0 h-full w-80 opacity-30">
        <div className="absolute right-10 top-8 h-24 w-24 rounded-3xl border border-slate-200 rotate-45"></div>
        <div className="absolute right-24 top-32 h-16 w-16 rounded-2xl border border-slate-200 rotate-45"></div>
        <div className="absolute right-0 top-40 h-32 w-32 rounded-[40px] border border-slate-200 rotate-45"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">

        <h2 className="text-5xl font-bold tracking-tight text-slate-900">
        Recherchez un produit
        </h2>

        <div className="mt-10">
          <SearchBar />
        </div>

        <div className="mt-6 text-sm text-slate-500">
          Exemples populaires :
          <span className="ml-3 font-medium text-blue-600">M8x20</span>
          <span className="mx-2">•</span>
          <span className="font-medium text-blue-600">Disque zirconium</span>
          <span className="mx-2">•</span>
          <span className="font-medium text-blue-600">Gants soudure</span>
        </div>

      </div>
    </section>
  );
}