"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, Globe, ShoppingCart,
  User, Calendar, CheckCircle, XCircle, Clock, MessageSquare, FileText,
} from "lucide-react";

// ─── Types ───

interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  countryCode?: string | null;
  isActive: boolean;
  distributor?: { id: string; name: string; code: string } | null;
  dealer?: { id: string; name: string; code: string } | null;
  subDealer?: { id: string; name: string; code: string } | null;
  orders: CustomerOrder[];
  esims: CustomerEsim[];
  createdAt: string;
  updatedAt: string;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: { product: { name: string } | null }[];
}

interface CustomerEsim {
  id: string;
  iccid: string;
  status: string;
  imsi?: string | null;
  msisdn?: string | null;
  qrCodeUrl?: string | null;
  activatedAt?: string | null;
  createdAt: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  newValue?: unknown;
  createdAt: string;
}

interface SupportTicketEntry {
  id: string;
  subject: string;
  description?: string | null;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string | null;
}

// ─── Helpers ───

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  COMPLETED: "default", PROCESSING: "secondary", PENDING: "outline",
  PAID: "default", CANCELLED: "destructive", FAILED: "destructive", REFUNDED: "outline",
  DRAFT: "secondary",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "Tamamlandı", PROCESSING: "İşleniyor", PENDING: "Bekliyor",
  PAID: "Ödendi", CANCELLED: "İptal", FAILED: "Başarısız", REFUNDED: "İade",
  DRAFT: "Taslak",
};

const esimStatusLabel: Record<string, string> = {
  AVAILABLE: "Kullanılabilir", ASSIGNED: "Atanmış", ACTIVATED: "Aktif",
  SUSPENDED: "Askıya Alındı", TERMINATED: "Sonlandırıldı", EXPIRED: "Süresi Doldu",
};

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

// ─── Page ───

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "orders" | "esims" | "logs" | "tickets">("profile");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [tickets, setTickets] = useState<SupportTicketEntry[]>([]);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/customers/${id}`, { credentials: "include" });
    const json = await res.json();
    if (json.success) setCustomer(json.data);
    setLoading(false);
  }, [id]);

  const fetchLogs = useCallback(async () => {
    const res = await fetch(`/api/v1/audit-logs?entity=Customer&entityId=${id}&pageSize=50`, { credentials: "include" });
    const json = await res.json();
    if (json.success) setLogs(json.data);
  }, [id]);

  const fetchTickets = useCallback(async () => {
    const res = await fetch(`/api/v1/support-tickets?customerId=${id}`, { credentials: "include" });
    const json = await res.json();
    if (json.success) setTickets(json.data);
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  if (loading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-64 animate-pulse rounded bg-muted" /></div>;
  if (!customer) return <div className="text-center py-16 text-muted-foreground">Müşteri bulunamadı</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-muted-foreground">Müşteri Profili</p>
        </div>
        <div className="ml-auto">
          {statusBadge(customer.isActive)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { key: "profile" as const, label: "Profil", icon: User },
          { key: "orders" as const, label: "Siparişler", icon: ShoppingCart },
          { key: "esims" as const, label: "eSIM'ler", icon: Globe },
          { key: "tickets" as const, label: "Destek Talepleri", icon: MessageSquare },
          { key: "logs" as const, label: "İşlem Logları", icon: Clock },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key ? "border-b-2 border-primary text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="h-4 w-4" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && <ProfileTab customer={customer} />}
      {tab === "orders" && <OrdersTab orders={customer.orders} />}
      {tab === "esims" && <EsimsTab esims={customer.esims} />}
      {tab === "logs" && <LogsTab logs={logs} />}
      {tab === "tickets" && <TicketsTab tickets={tickets} customerId={customer.id} onRefresh={fetchTickets} />}
    </div>
  );
}

// ─── Sub-components ───

function statusBadge(active: boolean) {
  return active
    ? <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
    : <Badge className="bg-red-100 text-red-700">Pasif</Badge>;
}

function ProfileTab({ customer }: { customer: CustomerDetail }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Contact Info */}
      <Card>
        <CardHeader><CardTitle>İletişim Bilgileri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Mail} label="E-posta" value={customer.email} />
          <InfoRow icon={Phone} label="Telefon" value={customer.phone ?? "Belirtilmemiş"} />
          <InfoRow icon={MapPin} label="Ülke" value={customer.countryCode ?? "Belirtilmemiş"} />
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader><CardTitle>Organizasyon Bağlantıları</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Building2} label="Distribütör" value={customer.distributor?.name ?? "Bağlı değil"} />
          <InfoRow icon={Building2} label="Bayi" value={customer.dealer?.name ?? "Bağlı değil"} />
          <InfoRow icon={Building2} label="Alt Bayi" value={customer.subDealer?.name ?? "Bağlı değil"} />
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader><CardTitle>Hesap Bilgileri</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={Calendar} label="Kayıt Tarihi" value={new Date(customer.createdAt).toLocaleString("tr-TR")} />
          <InfoRow icon={Calendar} label="Son Güncelleme" value={new Date(customer.updatedAt).toLocaleString("tr-TR")} />
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div><div className="text-sm text-muted-foreground">Durum</div><div className="font-medium">{customer.isActive ? "Aktif" : "Pasif"}</div></div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Özet</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={ShoppingCart} label="Toplam Sipariş" value={`${customer.orders.length} adet`} />
          <InfoRow icon={Globe} label="Aktif eSIM" value={`${customer.esims.filter(e => e.status === "ACTIVATED" || e.status === "ASSIGNED").length} adet`} />
          <InfoRow icon={Globe} label="Toplam eSIM" value={`${customer.esims.length} adet`} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: CustomerOrder[] }) {
  if (orders.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">Henüz sipariş bulunmamaktadır</CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>Sipariş Geçmişi</CardTitle><CardDescription>Son {orders.length} sipariş</CardDescription></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.orderNumber}</TableCell>
                <TableCell>{o.items[0]?.product?.name ?? "-"}</TableCell>
                <TableCell>{formatCurrency(Number(o.totalAmount), o.currency)}</TableCell>
                <TableCell><Badge variant={statusVariant[o.status] ?? "outline"}>{statusLabel[o.status] ?? o.status}</Badge></TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString("tr-TR")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function EsimsTab({ esims }: { esims: CustomerEsim[] }) {
  if (esims.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">Henüz eSIM bulunmamaktadır</CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>eSIM'ler</CardTitle><CardDescription>{esims.length} eSIM profili</CardDescription></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ICCID</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>IMSI</TableHead>
              <TableHead>MSISDN</TableHead>
              <TableHead className="text-right">Aktivasyon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {esims.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium font-mono text-xs">{e.iccid}</TableCell>
                <TableCell><Badge variant={e.status === "ACTIVATED" ? "default" : e.status === "SUSPENDED" ? "destructive" : "secondary"}>{esimStatusLabel[e.status] ?? e.status}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{e.imsi ?? "-"}</TableCell>
                <TableCell>{e.msisdn ?? "-"}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{e.activatedAt ? new Date(e.activatedAt).toLocaleString("tr-TR") : "Aktif değil"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const actionLabels: Record<string, string> = {
  CREATE: "Oluşturma", UPDATE: "Güncelleme", DELETE: "Silme",
  ACTIVATE: "Aktifleştirme", DEACTIVATE: "Pasifleştirme",
};

function LogsTab({ logs }: { logs: AuditLogEntry[] }) {
  if (logs.length === 0) return <Card><CardContent className="py-8 text-center text-muted-foreground">Henüz işlem logu bulunmamaktadır</CardContent></Card>;

  return (
    <Card>
      <CardHeader><CardTitle>İşlem Logları</CardTitle><CardDescription>Son {logs.length} işlem</CardDescription></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <Badge variant="outline" className="shrink-0">{actionLabels[log.action] ?? log.action}</Badge>
              <span className="text-muted-foreground flex-1">{log.entity}</span>
              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("tr-TR")}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const ticketStatusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  OPEN: "default", IN_PROGRESS: "secondary", RESOLVED: "default", CLOSED: "outline",
};
const ticketStatusLabel: Record<string, string> = {
  OPEN: "Açık", IN_PROGRESS: "İşleniyor", RESOLVED: "Çözüldü", CLOSED: "Kapandı",
};
const ticketPriorityLabel: Record<string, string> = {
  LOW: "Düşük", NORMAL: "Normal", HIGH: "Yüksek", URGENT: "Acil",
};

function TicketsTab({ tickets, customerId, onRefresh }: { tickets: SupportTicketEntry[]; customerId: string; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!subject.trim()) return;
    setSaving(true);
    await fetch("/api/v1/support-tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ customerId, subject, description, priority: "NORMAL" }),
    });
    setSaving(false);
    setShowForm(false);
    setSubject("");
    setDescription("");
    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Destek Talepleri</CardTitle>
          <CardDescription>{tickets.length} talep</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? "İptal" : "Yeni Talep"}</Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-4 space-y-3 rounded-lg border p-4">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Konu"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Açıklama (opsiyonel)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button size="sm" onClick={handleCreate} disabled={saving || !subject.trim()}>
              {saving ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        )}
        {tickets.length === 0 && !showForm ? (
          <div className="py-8 text-center text-muted-foreground">Henüz destek talebi bulunmamaktadır</div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.subject}</div>
                  {t.description && <div className="text-xs text-muted-foreground truncate">{t.description}</div>}
                </div>
                <Badge variant={ticketStatusVariant[t.status] ?? "outline"}>{ticketStatusLabel[t.status] ?? t.status}</Badge>
                <span className="text-xs text-muted-foreground">{ticketPriorityLabel[t.priority] ?? t.priority}</span>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(t.createdAt).toLocaleDateString("tr-TR")}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
