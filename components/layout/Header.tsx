"use client";

import Link from "next/link";
import Image from "next/image";
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
  ShoppingCart,
} from "lucide-react";

import CartButton from "@/components/panier/CartButton";
import { useCart } from "@/context/cart-context";

export default function Header() {
  const pathname = usePathname();
  const { totalItems } = useCart();
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
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[11.25rem] flex-col border-r border-white/10 bg-[#172025] text-white lg:flex">
        <Link href="/" className="flex min-h-[5rem] items-center justify-center border-b border-white/10 px-3">
          <Image src="/decoupe-laser-logo-officiel-orange-intense.png" alt="Découpe Laser" width={168} height={65} className="h-auto w-full object-contain" priority />
        </Link>

        <nav className="space-y-1 px-3 py-6" aria-label="Navigation principale">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[3.35rem] items-center gap-3 rounded-lg px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-[#F95516] text-white shadow-[0_8px_20px_rgba(249,85,22,0.18)]"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <div className="my-4 border-t border-white/15" />
          <Link
            href="/panier"
            className={`relative flex min-h-[3.35rem] items-center gap-3 rounded-lg px-4 text-sm font-semibold transition ${
              isActive("/panier")
                ? "bg-[#F95516] text-white"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <ClipboardList size={20} aria-hidden="true" />
            Panier
            {totalItems > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f15a24] px-1 text-[11px] text-white">{totalItems}</span>}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`mt-1 flex min-h-[3.35rem] items-center gap-3 rounded-lg px-4 text-sm font-semibold transition ${
                isActive("/admin")
                ? "bg-[#F95516] text-white"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Settings size={20} aria-hidden="true" />
              Administration
            </Link>
          )}
        </nav>

        <div className="mt-auto p-6">
          <div className="text-slate-400">
            <ShieldCheck size={21} aria-hidden="true" />
            <p className="mt-3 text-xs font-semibold text-slate-200">Découpe Laser</p>
            <p className="mt-1 text-[11px] leading-5">Catalogue interne<br />V2.0</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 mx-auto mb-4 max-w-[1600px] px-0 sm:mb-6 lg:mb-0 lg:max-w-none">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#172025] px-4 py-3 shadow-sm sm:px-6 lg:h-[5rem] lg:gap-7 lg:border-slate-200 lg:bg-white/95 lg:px-9 lg:py-0">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:flex-none">
          <span className="flex h-10 w-[105px] shrink-0 items-center justify-center lg:hidden">
            <Image src="/decoupe-laser-logo-officiel-orange-intense.png" alt="Découpe Laser" width={105} height={41} className="h-auto w-full object-contain" priority />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-white sm:text-2xl lg:text-[#121820]">
              Commande Atelier
            </h1>
            <p className="hidden text-sm text-slate-300 sm:block lg:text-[#626B72]">
              Catalogue interne
            </p>
          </div>
        </Link>

        <form onSubmit={submitGlobalSearch} className="hidden max-w-[34rem] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm lg:flex">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100"><Search size={21} className="text-[#1d3440]" aria-hidden="true" /></span>
          <input
            type="search"
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Rechercher un produit, une famille, une référence..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#2F3437] outline-none placeholder:text-slate-400"
            aria-label="Rechercher dans le catalogue"
          />
          <kbd className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-400">Ctrl + K</kbd>
        </form>

        <nav className="hidden items-center gap-5 xl:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return <Link key={item.href} href={item.href} className={`flex h-[5rem] items-center gap-2 border-b-2 px-1 text-sm font-semibold ${active ? "border-[#F95516] text-[#F95516]" : "border-transparent text-slate-700 hover:text-[#F95516]"}`}><Icon size={19} />{item.label}</Link>;
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

      </div>
      <form onSubmit={submitGlobalSearch} className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
        <Search size={18} className="shrink-0 text-[#142026]" aria-hidden="true" />
        <input type="search" value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Rechercher un produit ou une référence..." aria-label="Rechercher dans le catalogue" className="min-h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
        <button type="submit" className="rounded-md bg-[#F95516] px-3 py-2 text-xs font-semibold text-white">Chercher</button>
      </form>
      </header>
      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur lg:hidden">
        {[
          { href: "/", label: "Accueil", icon: Home },
          { href: "/#catalogue", label: "Catalogue", icon: FolderOpen },
          { href: "/stock", label: "Stock", icon: Package },
          { href: "/panier", label: "Panier", icon: ShoppingCart },
        ].map(({ href, label, icon: Icon }) => {
          const active = href === "/#catalogue" ? false : isActive(href);
          return <Link key={label} href={href} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-[#F95516]" : "text-slate-600"}`}><Icon size={21} aria-hidden="true" />{label}{label === "Panier" && totalItems > 0 && <span className="absolute right-3 top-1 rounded-full bg-[#F95516] px-1.5 text-[10px] text-white">{totalItems}</span>}</Link>;
        })}
      </nav>
    </>
  );
}
