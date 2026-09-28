"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { stockAlertStatusLabel, type StockAlertDisplayStatus } from "@/lib/stock-alerts";

const statusStyle: Record<StockAlertDisplayStatus, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  a_recommander: "bg-orange-50 text-[#c2410c]",
  rupture: "bg-red-50 text-red-700",
  non_defini: "bg-slate-100 text-slate-500",
};

export function LengthThresholdCell({
  seuil,
  onSave,
}: {
  seuil: number | null;
  onSave: (seuil: number | null) => Promise<boolean>;
}) {
  const [value, setValue] = useState(seuil === null ? "" : String(seuil));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);

  const normalized = value.trim();
  const nextValue = normalized === "" ? null : Number(normalized);
  const valid = nextValue === null || (Number.isInteger(nextValue) && nextValue >= 0);
  const changed = (nextValue ?? null) !== seuil;

  async function save() {
    if (!valid || !changed || saving) return;
    setSaving(true);
    setFeedback(null);
    const saved = await onSave(nextValue);
    setFeedback(saved ? "saved" : "error");
    setSaving(false);
  }

  return (
    <div className="flex min-w-[215px] items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          aria-label="Seuil de longueur en millimètres"
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setFeedback(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") void save();
          }}
          placeholder="Non défini"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-10 text-sm font-medium outline-none transition focus:border-[#F95516] focus:ring-2 focus:ring-orange-100"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mm</span>
      </div>
      <button
        type="button"
        aria-label="Enregistrer le seuil"
        title={nextValue === null ? "Supprimer le seuil" : "Enregistrer le seuil"}
        onClick={() => void save()}
        disabled={!valid || !changed || saving}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed ${changed && valid ? "border-[#F95516] bg-[#F95516] text-white shadow-sm hover:bg-[#e04d13]" : "border-slate-200 bg-white text-slate-400 disabled:opacity-70"}`}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      </button>
      {feedback === "saved" && <span role="status" className="whitespace-nowrap text-xs font-semibold text-emerald-700">Enregistré</span>}
      {feedback === "error" && <span role="alert" className="whitespace-nowrap text-xs font-semibold text-red-700">Erreur</span>}
    </div>
  );
}

export function LengthStockStatusBadge({ statut }: { statut: StockAlertDisplayStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[statut]}`}>
      {stockAlertStatusLabel(statut)}
    </span>
  );
}
