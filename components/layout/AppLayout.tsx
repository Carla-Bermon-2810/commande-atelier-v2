import { ReactNode } from "react";
import Header from "./Header";

interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <div className="mx-auto max-w-[1500px] px-8 py-6">
        {children}
      </div>
    </main>
  );
}