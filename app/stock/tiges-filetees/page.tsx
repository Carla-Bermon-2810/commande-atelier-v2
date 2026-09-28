import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockTigesFiletees from "@/components/stock/stock-tiges-filetees";
import Link from "next/link";

export default function TigesFileteesStockPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1500px]">
        <div className="pt-2">
          <BackButton href="/stock" />
        </div>
        <nav aria-label="Fil d’Ariane" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
          <Link href="/stock" className="transition hover:text-[#F95516]">Stock</Link>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="text-[#17232b]">Tiges filetées</span>
        </nav>

        <StockTigesFiletees />
      </div>
    </AppLayout>
  );
}
