import { Suspense } from "react";

import StockAlertsCenter from "@/components/stock/StockAlertsCenter";

export default function StockAlertsPage() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">Chargement des alertes…</div>}><StockAlertsCenter /></Suspense>;
}
