"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FolderOpen,
  LayoutDashboard,
  History,
  Settings,
  UserCircle2,
} from "lucide-react";
import CartButton from "@/components/panier/CartButton";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Catalogue",
      icon: FolderOpen,
    },
    {
      href: "/admin/commandes",
      label: "Historique",
      icon: History,
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/admin",
      label: "Administration",
      icon: Settings,
    },
  ];

  return (
    <header className="sticky top-4 z-50 mb-8">
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-8 py-5 shadow-xl backdrop-blur">

        {/* Logo */}

        <Link href="/" className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F95516] to-[#ff7b45] text-2xl font-bold text-white shadow-lg">
            DL
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#2F3437]">
              Commande Atelier
            </h1>

            <p className="text-sm text-[#626B72]">
              Découpe Laser • Catalogue interne
            </p>
          </div>

        </Link>

       {/* Navigation */}

        <nav className="hidden lg:flex items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            const active =
            pathname === item.href ||
            (
              item.href !== "/" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href)
            ) ||
            (
              item.href === "/admin" &&
              pathname === "/admin"
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2 rounded-2xl px-5 py-3 font-medium transition-all duration-200 ${
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

        {/* Actions */}

        <div className="flex items-center gap-3">

          <button className="rounded-2xl border border-slate-200 p-3 transition hover:border-[#F95516] hover:text-[#F95516]">
            <Bell size={20} />
          </button>

          <CartButton />

          <button className="rounded-2xl border border-slate-200 p-2 transition hover:border-[#F95516] hover:text-[#F95516]">
            <UserCircle2 size={34} />
          </button>

        </div>

      </div>
    </header>
  );
}