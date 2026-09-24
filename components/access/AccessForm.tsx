"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setError(result.message ?? "Accès impossible.");
        return;
      }
      const suivant = searchParams.get("suivant");
      router.replace(suivant?.startsWith("/") ? suivant : "/");
      router.refresh();
    } catch {
      setError("Impossible de vérifier le code. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(30,41,59,.10)] sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F95516]"><KeyRound size={24} /></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-[#F95516]">Découpe Laser</p>
      <h1 className="mt-2 text-2xl font-bold text-[#27313A]">Administration</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Saisissez le code Administrateur. Il restera enregistré sur cet appareil.</p>
      <label htmlFor="access-code" className="mt-6 block text-sm font-semibold text-slate-700">Code d&apos;accès</label>
      <input id="access-code" type="password" autoComplete="current-password" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base" disabled={loading} required />
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F95516] px-4 font-bold text-white hover:bg-[#df4b13] disabled:opacity-60">{loading ? <><Loader2 size={18} className="animate-spin" /> Vérification…</> : "Accéder à l'administration"}</button>
    </form>
  );
}
