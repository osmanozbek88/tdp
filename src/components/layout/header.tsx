"use client";

import {
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getUser,
  clearAuth,
  getRefreshToken,
  type AuthUser,
} from "@/lib/auth/client";

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Süper Yönetici",
    DISTRIBUTOR_ADMIN: "Distribütör Yönetici",
    DISTRIBUTOR_STAFF: "Distribütör Personel",
    DEALER_ADMIN: "Bayi Yönetici",
    DEALER_STAFF: "Bayi Personel",
    SUB_DEALER_ADMIN: "Alt Bayi Yönetici",
    SUB_DEALER_STAFF: "Alt Bayi Personel",
    EMPLOYEE: "Çalışan",
    CUSTOMER: "Müşteri",
  };
  return labels[role] ?? role;
}

export function Header() {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const toggleTheme = () => {
    setDark(!dark);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = useCallback(async () => {
    console.log("[LOGOUT] Starting logout...");
    // Always call logout API to clear httpOnly cookies
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      console.log("[LOGOUT] API response:", res.status);
    } catch (err) {
      console.log("[LOGOUT] API call failed:", err);
    }
    clearAuth();
    router.push("/login");
  }, [router]);

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "??";

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "Kullanıcı";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sipariş, müşteri ara..."
            className="pl-10 bg-muted/50 border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {user ? roleLabel(user.role) : "Yükleniyor..."}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
