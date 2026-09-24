"use client";

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F95516]">Une erreur est survenue</p>
        <h1 className="mt-3 text-2xl font-bold text-[#2F3437]">La page ne peut pas être affichée.</h1>
        <p className="mt-3 text-slate-600">Réessayez. Si le problème persiste, prévenez un administrateur de l’atelier.</p>
        <button type="button" onClick={() => unstable_retry()} className="mt-6 min-h-12 rounded-xl bg-[#F95516] px-5 font-semibold text-white hover:bg-[#e04d13]">Réessayer</button>
      </section>
    </main>
  );
}
