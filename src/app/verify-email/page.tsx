

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, Loader2, CheckCircle2, XCircle } from "lucide-react";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Doğrulama bağlantısı geçersiz veya eksik.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (res.ok) {
          setStatus("ok");
          setMessage("E-posta adresiniz başarıyla doğrulandı!");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(json.error?.message || "Doğrulama başarısız oldu.");
        }
      } catch {
        setStatus("error");
        setMessage("Bir hata oluştu, lütfen tekrar deneyin.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-background">
      <Card className="w-full max-w-sm text-center">
        <CardContent className="pt-8 space-y-4">
          {status === "loading" && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle>Doğrulanıyor...</CardTitle>
              <CardDescription>
                E-posta adresiniz doğrulanıyor, lütfen bekleyin.
              </CardDescription>
            </>
          )}
          {status === "ok" && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>Doğrulandı!</CardTitle>
              <CardDescription>
                {message} Giriş sayfasına yönlendiriliyorsunuz...
              </CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Doğrulama Başarısız</CardTitle>
              <CardDescription>{message}</CardDescription>
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login" className="text-sm text-primary hover:underline">
                  Giriş sayfasına dön
                </Link>
                <Link href="/api/auth/resend-verification" className="text-xs text-muted-foreground hover:underline">
                  Doğrulama e-postasını tekrar gönder
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-6 bg-background">
        Yükleniyor...
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

