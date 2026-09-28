import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import Stock from "@/components/stock/stock";
import Link from "next/link";

export default function TubesInoxPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/tubes" />
      <nav aria-label="Fil d’Ariane" className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Link href="/stock" className="transition hover:text-[#F95516]">Stock</Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <Link href="/stock/tubes" className="transition hover:text-[#F95516]">Tubes</Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-[#17232b]">Inox</span>
      </nav>
      <Stock matiere="inox" premiumLayout />
    </AppLayout>
  );
}
