import { ReactNode } from "react";
import Header from "./Header";

interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-transparent pb-20 lg:pb-0 lg:pl-[11.25rem]">
      <Header />

      <div className="mx-auto max-w-[1600px] px-3 pb-6 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        {children}
      </div>
    </main>
  );
}
