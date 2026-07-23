"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }

    setLoading(true);

    // Simulate login - will be replaced with real auth
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col justify-center px-12 text-primary-foreground">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Globe className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">TDP</h1>
                <p className="text-primary-foreground/80 text-sm">Telekom Dağıtım Platformu</p>
              </div>
            </div>
            <div className="space-y-3 pt-6">
              <h2 className="text-2xl font-semibold">Hoş geldiniz</h2>
              <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-md">
                eSIM ve veri paketi dağıtım ağınızı yönetin. Siparişleri takip edin, müşterilerinizi yönetin ve işinizi büyütün.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8">
              {[
                { value: "10K+", label: "Aktif eSIM" },
                { value: "500+", label: "Bayi" },
                { value: "99.9%", label: "Çalışma Süresi" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur p-4 text-center">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-primary-foreground/70 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Globe className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">TDP</h1>
            <p className="text-muted-foreground text-sm">Telekom Dağıtım Platformu</p>
          </div>

          <Card className="border-none shadow-none lg:border lg:shadow-sm">
            <CardHeader className="lg:px-6">
              <CardTitle className="text-xl">Giriş Yap</CardTitle>
              <CardDescription>
                Hesabınıza erişmek için kimlik bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 lg:px-6">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@firma.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                    <Link
                      href="#"
                      className="text-xs text-primary hover:underline"
                    >
                      Şifremi unuttum?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </CardContent>
              <CardFooter className="flex-col gap-2 lg:px-6">
                <p className="text-sm text-muted-foreground text-center">
                  Hesabınız yok mu?{" "}
                  <Link href="#" className="text-primary hover:underline font-medium">
                    Destek ile iletişime geçin
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} TDP. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
