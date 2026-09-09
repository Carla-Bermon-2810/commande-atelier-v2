"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import StockVis from "@/components/stock/stock-vis";

export default function VisStockPage() {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <div className="pt-2">
          <button
            onClick={() => router.push("/stock")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#F95516]"
          >
            <ArrowLeft size={18} />
            Retour
          </button>
        </div>

        <StockVis />
      </div>
    </AppLayout>
  );
}