import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import StockOutillage from "@/components/stock/stock-outillage";
import Link from "next/link";

export default function FraisesPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/outillage" />
      <nav
        aria-label="Fil d’Ariane"
        className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500"
      >
        <Link href="/stock" className="transition hover:text-[#F95516]">Stock</Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <Link href="/stock/outillage" className="transition hover:text-[#F95516]">Outillage</Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-[#17232b]">Fraises</span>
      </nav>
      <StockOutillage type="fraises" />
    </AppLayout>
  );
}
