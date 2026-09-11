import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  href: string;
}

export default function BackButton({ href }: Props) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-[#F95516] hover:bg-orange-50 hover:text-[#F95516]"
    >
      <ArrowLeft size={18} />
      Retour
    </Link>
  );
}