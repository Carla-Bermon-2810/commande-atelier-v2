"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  FolderOpen,
  Home,
  Search,
  Settings,
  Package,
  ShieldCheck,
} from "lucide-react";

import CartButton from "@/components/panier/CartButton";

export default function Header() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

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

  const sidebarItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/#catalogue", label: "Catalogue", icon: FolderOpen },
    { href: "/stock", label: "Stock", icon: Package },
  ];

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/" && href !== "/admin" && pathname.startsWith(href)) ||
    (href === "/admin" && pathname.startsWith("/admin"));

  const submitGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = globalSearch.trim();
    window.location.assign(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[17.5rem] flex-col border-r border-white/10 bg-[#111b20] text-white lg:flex">
        <Link href="/" className="flex min-h-28 items-center gap-3 border-b border-white/10 px-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f697d] to-[#173e4d] text-xl font-black tracking-tighter text-white shadow-lg">
            DL
          </div>
          <div>
            <p className="text-base font-bold tracking-tight">Commande Atelier</p>
            <p className="mt-0.5 text-xs text-slate-400">Découpe Laser</p>
          </div>
        </Link>

        <nav className="space-y-1 px-4 py-7" aria-label="Navigation principale">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-13 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-[#24596c] text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <div className="my-5 border-t border-white/10" />
          <Link
            href="/panier"
            className={`flex min-h-13 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
              isActive("/panier")
                ? "bg-[#24596c] text-white"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <ClipboardList size={20} aria-hidden="true" />
            Panier
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`mt-1 flex min-h-13 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition ${
                isActive("/admin")
                  ? "bg-[#24596c] text-white"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Settings size={20} aria-hidden="true" />
              Administration
            </Link>
          )}
        </nav>

        <div className="mt-auto border-t border-white/10 p-6">
          <div className="flex items-center gap-3 text-slate-400">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-slate-300">Espace atelier</p>
              <p className="mt-0.5 text-[11px]">Catalogue et stock partagés</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-2 z-40 mx-auto mb-4 max-w-[1600px] px-3 sm:top-3 sm:mb-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-3 shadow-[0_8px_24px_rgba(30,41,59,0.08)] backdrop-blur sm:gap-3 sm:px-5 lg:rounded-xl lg:px-6">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:flex-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e4c5e] to-[#356779] text-lg font-bold text-white shadow-md sm:h-12 sm:w-12 sm:text-2xl lg:hidden">
            DL
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-[#2F3437] sm:text-2xl">
              Commande Atelier
            </h1>
            <p className="hidden text-sm text-[#626B72] sm:block">
              Catalogue interne
            </p>
          </div>
        </Link>

        <form onSubmit={submitGlobalSearch} className="hidden max-w-xl flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:flex">
          <Search size={20} className="shrink-0 text-[#1e4c5e]" aria-hidden="true" />
          <input
            type="search"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Rechercher un produit, une famille, une référence..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#2F3437] outline-none placeholder:text-slate-400"
            aria-label="Rechercher dans le catalogue"
          />
          <kbd className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-400">Entrée</kbd>
        </form>

        <nav className="hidden items-center gap-2 xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold ${active ? "border-[#f15a24] text-[#f15a24]" : "border-transparent text-slate-600 hover:text-[#1e4c5e]"}`}><Icon size={19} />{item.label}</Link>;
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <CartButton />
          {isAdmin && <Link
            href="/admin"
            aria-label="Administration"
            title="Administration"
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e4c5e] focus:ring-offset-2 ${
              isActive("/admin")
                ? "border-[#c4d8de] bg-[#eaf1f3] text-[#1e4c5e]"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#c4d8de] hover:bg-[#eaf1f3] hover:text-[#1e4c5e]"
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
                    ? "bg-[#eaf1f3] text-[#1e4c5e]"
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
    </>
  );
}
