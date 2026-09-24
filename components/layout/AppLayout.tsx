import { ReactNode } from "react";
import Header from "./Header";

interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-transparent">
      <Header />

      <div className="mx-auto max-w-[1500px] px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        {children}
      </div>
    </main>
  );
}
