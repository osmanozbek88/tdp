"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Building2,
  Globe,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useCallback } from "react";
import { clearAuth } from "@/lib/auth/client";

const navItems = [
  { label: "Genel Bakış", href: "/dashboard", icon: LayoutDashboard },
  { label: "Siparişler", href: "/dashboard/orders", icon: ShoppingCart },
  { label: "Ürünler", href: "/dashboard/products", icon: Package },
  { label: "Müşteriler", href: "/dashboard/customers", icon: Users },
  { label: "Bayiler", href: "/dashboard/tenants", icon: Building2 },
  { label: "eSIM'ler", href: "/dashboard/esims", icon: Globe },
  { label: "Raporlar", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Ayarlar", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // silent
    }
    clearAuth();
    router.push("/login");
  }, [router]);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              T
            </div>
            <span>TDP</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              T
            </div>
          </Link>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Collapse toggle & Logout */}
      <div className="p-3 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full", collapsed ? "justify-center px-2" : "justify-start")}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /> Daralt</>}
        </Button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-destructive hover:bg-destructive/10 w-full",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
