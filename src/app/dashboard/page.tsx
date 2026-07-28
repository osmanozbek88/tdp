"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
  HeartPulse,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

// ─── Types ───

interface DashboardData {
  sales: { daily: number; monthly: number; currency: string };
  orderCount: { today: number; thisMonth: number };
  accounts: { distributors: number; customers: number };
  recentOrders: RecentOrder[];
  providerHealth: ProviderHealth | null;
}

interface RecentOrder {
  orderId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface ProviderHealth {
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  uptimePercentage30d: number;
  lastCheckedAt: string;
}

// ─── Helpers ───

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  COMPLETED: "default",
  PROCESSING: "secondary",
  PENDING: "outline",
  PAID: "default",
  CANCELLED: "destructive",
  FAILED: "destructive",
  REFUNDED: "outline",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "Tamamlandı",
  PROCESSING: "İşleniyor",
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  CANCELLED: "İptal",
  FAILED: "Başarısız",
  REFUNDED: "İade",
};

function getProviderBadge(health: ProviderHealth | null): {
  label: string;
  className: string;
} {
  if (!health) return { label: "Bekleniyor", className: "bg-muted text-muted-foreground" };
  switch (health.status) {
    case "healthy":
      return { label: "Sağlıklı", className: "bg-emerald-100 text-emerald-700" };
    case "degraded":
      return { label: "Yavaş", className: "bg-amber-100 text-amber-700" };
    case "down":
      return { label: "Kapalı", className: "bg-red-100 text-red-700" };
  }
}

// ─── Component ───

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCountPeriod, setOrderCountPeriod] = useState<"today" | "month">("today");
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "month">("today");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Veri alınamadı");
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center">
            <p className="text-destructive font-medium mb-2">Veri yüklenemedi</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" /> Tekrar Dene
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const providerBadge = getProviderBadge(data.providerHealth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>
          <p className="text-muted-foreground mt-1">
            Platformunuzun anlık durumu — veriler 30 saniyede bir yenilenir
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Yenile
        </button>
      </div>

      {/* Row 1: Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Günlük Satış"
          value={formatCurrency(data.sales.daily)}
          icon={DollarSign}
          subtitle={data.sales.daily > 0 ? "Bugün" : "Henüz sipariş yok"}
        />
        <StatCard
          title="Aylık Satış"
          value={formatCurrency(data.sales.monthly)}
          icon={TrendingUp}
          subtitle="Bu ay"
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sipariş Sayısı
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderCountPeriod === "today"
                ? data.orderCount.today
                : data.orderCount.thisMonth}
            </div>
            <div className="mt-2 flex gap-1">
              <button
                onClick={() => setOrderCountPeriod("today")}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  orderCountPeriod === "today"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Bugün
              </button>
              <button
                onClick={() => setOrderCountPeriod("month")}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  orderCountPeriod === "month"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Bu Ay
              </button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Provider Durumu
            </CardTitle>
            <HeartPulse className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${providerBadge.className}`}>
                {providerBadge.label}
              </span>
            </div>
            {data.providerHealth && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>Gecikme: {data.providerHealth.latencyMs} ms</div>
                <div>Son 30 gün: %{data.providerHealth.uptimePercentage30d.toFixed(1)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Account KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Bayi Sayısı"
          value={String(data.accounts.distributors)}
          icon={Building2}
          subtitle="Distribütör + Bayi + Alt Bayi"
        />
        <StatCard
          title="Müşteri Sayısı"
          value={String(data.accounts.customers)}
          icon={Users}
          subtitle="Toplam kayıtlı müşteri"
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gelir
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenuePeriod === "today"
                ? formatCurrency(data.sales.daily)
                : formatCurrency(data.sales.monthly)}
            </div>
            <div className="mt-2 flex gap-1">
              <button
                onClick={() => setRevenuePeriod("today")}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  revenuePeriod === "today"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Bugün
              </button>
              <button
                onClick={() => setRevenuePeriod("month")}
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  revenuePeriod === "month"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Bu Ay
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completed siparişler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Para Birimi
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sales.currency}</div>
            <p className="text-xs text-muted-foreground mt-1">Tüm işlemler bu para biriminde</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders — full width */}
      <Card>
        <CardHeader>
          <CardTitle>Son Siparişler</CardTitle>
          <CardDescription>En son 15 sipariş</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Henüz hiç sipariş yok
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>
                      <div>{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{order.productName}</TableCell>
                    <TableCell>{formatCurrency(order.totalAmount, order.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[order.status] ?? "outline"}>
                        {statusLabel[order.status] ?? order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("tr-TR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ───

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-96 mt-2 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-28 animate-pulse rounded bg-muted mb-2" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i + 4}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-28 animate-pulse rounded bg-muted mb-2" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
