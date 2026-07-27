
"use client";

import { useState } from "react";
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
import { Globe, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Lütfen e-posta adresinizi girin");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Bir hata oluştu");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 bg-background">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle>E-posta Gönderildi</CardTitle>
            <CardDescription>
              {email} adresine şifre sıfırlama bağlantısı gönderdik.
              Lütfen gelen kutunuzu kontrol edin.
            </CardDescription>
            <Link href="/login" className="inline-block text-sm text-primary hover:underline">
              ← Giriş sayfasına dön
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
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
              <h2 className="text-2xl font-semibold">Şifrenizi mi unuttunuz?</h2>
              <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-md">
                Endişelenmeyin! E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Globe className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">TDP</h1>
          </div>

          <Card className="border-none shadow-none lg:border lg:shadow-sm">
            <CardHeader className="lg:px-6">
              <CardTitle className="text-xl">Şifre Sıfırlama</CardTitle>
              <CardDescription>
                E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                </Button>
              </CardContent>
              <CardFooter className="lg:px-6">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Giriş sayfasına dön
                </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
