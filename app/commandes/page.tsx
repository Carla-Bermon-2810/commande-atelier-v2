import { Suspense } from "react";

import AppLayout from "@/components/layout/AppLayout";
import CommandesSuiviClient from "@/components/commandes/CommandesSuiviClient";

export default function CommandesPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-500">Chargement des commandes…</div>}>
        <CommandesSuiviClient />
      </Suspense>
    </AppLayout>
  );
}
