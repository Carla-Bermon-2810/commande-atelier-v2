"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderOpen,
  Settings,
  Package,
} from "lucide-react";

import CartButton from "@/components/panier/CartButton";

export default function Header() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/access")
      .then((response) => response.json())
      .then((result: { role?: string | null }) => setIsAdmin(result.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Catalogue", icon: FolderOpen },
    { href: "/stock", label: "Stock", icon: Package },
  ];

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" && href !== "/admin" && pathname.startsWith(href)) ||
    (href === "/admin" && pathname.startsWith("/admin"));

  return (
    <header className="sticky top-2 z-50 mx-auto mb-4 max-w-[1500px] px-3 sm:top-3 sm:mb-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-[0_8px_24px_rgba(30,41,59,0.08)] backdrop-blur sm:gap-3 sm:px-5 lg:px-6">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F95516] to-[#ff7b45] text-lg font-bold text-white shadow-md sm:h-12 sm:w-12 sm:text-2xl">
            DL
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-[#2F3437] sm:text-2xl">
              Commande Atelier
            </h1>
            <p className="hidden text-sm text-[#626B72] sm:block">
              Découpe Laser • Catalogue interne
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition-colors duration-200 ${
                  active
                    ? "bg-orange-50 text-[#F95516] shadow-sm"
                    : "text-[#626B72] hover:bg-slate-100 hover:text-[#F95516]"
                }`}
              >
                <Icon
                  size={19}
                  className="!text-[#F95516] flex-shrink-0"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <CartButton />
          {isAdmin && <Link
            href="/admin"
            aria-label="Administration"
            title="Administration"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#F95516] focus:ring-offset-2 ${
              isActive("/admin")
                ? "border-orange-200 bg-orange-50 text-[#F95516]"
                : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-[#F95516]"
            }`}
          >
            <Settings size={19} aria-hidden="true" />
          </Link>}
        </div>

        <nav className="grid w-full grid-cols-2 gap-2 border-t border-slate-100 pt-3 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-orange-50 text-[#F95516]"
                    : "bg-slate-50 text-slate-600 active:bg-slate-100"
                }`}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
