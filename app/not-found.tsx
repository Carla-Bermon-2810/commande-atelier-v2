import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F95516]">Page introuvable</p>
        <h1 className="mt-3 text-2xl font-bold text-[#2F3437]">Cette page n’existe pas ou n’est plus disponible.</h1>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#F95516] px-5 font-semibold text-white hover:bg-[#e04d13]">Retour au catalogue</Link>
      </section>
    </main>
  );
}
