import AppLayout from "@/components/layout/AppLayout";
import BackButton from "@/components/layout/BackButton";
import VisStock from "@/components/stock/stock-vis";
import Link from "next/link";

export default function VisPage() {
  return (
    <AppLayout>
      <BackButton href="/stock/fixations" />
      <nav
        aria-label="Fil d’Ariane"
        className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500"
      >
        <Link href="/stock" className="transition hover:text-[#F95516]">
          Stock
        </Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <Link href="/stock/fixations" className="transition hover:text-[#F95516]">
          Fixations
        </Link>
        <span aria-hidden="true" className="text-slate-300">/</span>
        <span className="text-[#17232b]">Vis</span>
      </nav>
      <VisStock />
    </AppLayout>
  );
}
