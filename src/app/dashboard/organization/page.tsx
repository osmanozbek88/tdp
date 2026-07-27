
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Building2, Building, Users, UserPlus, Search, RefreshCw,
  DollarSign, Percent, Tag,
} from "lucide-react";

// ─── Types ───

interface EntityBase {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  balance?: number;
  commissionRate?: number;
  priceGroup?: { id: string; name: string } | null;
  _count?: Record<string, number>;
  createdAt: string;
}

interface DistributorRow extends EntityBase {
  _count?: { dealers: number; subDealers: number; users: number; customers: number };
}

interface DealerRow extends EntityBase {
  distributor?: { id: string; name: string } | null;
  _count?: { subDealers: number; users: number; customers: number };
}

interface SubDealerRow extends EntityBase {
  dealer?: { id: string; name: string } | null;
  distributor?: { id: string; name: string } | null;
  _count?: { users: number; customers: number };
}

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  distributor?: { id: string; name: string } | null;
  dealer?: { id: string; name: string } | null;
  subDealer?: { id: string; name: string } | null;
}

interface PriceGroupRow {
  id: string;
  name: string;
  markupPercent: number;
  isActive: boolean;
  _count?: { distributors: number; dealers: number; subDealers: number };
}

interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

type Tab = "distributors" | "dealers" | "subDealers" | "employees" | "priceGroups";

// ─── Helpers ───

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Çalışan",
  DISTRIBUTOR_STAFF: "Distribütör Personel",
  DEALER_STAFF: "Bayi Personel",
  SUB_DEALER_STAFF: "Alt Bayi Personel",
};

function statusBadge(active: boolean) {
  return active
    ? <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
    : <Badge className="bg-red-100 text-red-700">Pasif</Badge>;
}

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "distributors", label: "Distribütörler", icon: Building2 },
  { key: "dealers", label: "Bayiler", icon: Building },
  { key: "subDealers", label: "Alt Bayiler", icon: Building },
  { key: "employees", label: "Personel", icon: Users },
  { key: "priceGroups", label: "Fiyat Grupları", icon: Tag },
];

// ─── Page ───

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("distributors");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(meta.page));
    params.set("pageSize", String(meta.pageSize));

    const url = `/api/v1/${activeTab}?${params}`;
    const res = await fetch(url, { credentials: "include" });
    const json = await res.json();
    if (json.success) {
      setData(json.data);
      setMeta(json.meta);
    }
    setLoading(false);
  }, [activeTab, search, meta.page, meta.pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleStatus = async (id: string) => {
    await fetch(`/api/v1/${activeTab}/${id}/toggle-status`, { method: "POST", credentials: "include" });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firma / Bayi Yönetimi</h1>
        <p className="text-muted-foreground mt-1">Distribütör, bayi, alt bayi, personel ve fiyat grubu yönetimi</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b pb-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setMeta({ page: 1, pageSize: 20, total: 0 }); }}
              className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setMeta((p) => ({ ...p, page: 1 })); } }}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button className="ml-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Yeni {TABS.find((t) => t.key === activeTab)?.label?.replace(/ler$/, "")} Ekle
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Yükleniyor...</div>
          ) : data.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">Kayıt bulunamadı</div>
          ) : activeTab === "distributors" ? (
            <DistributorTable data={data as DistributorRow[]} onToggle={toggleStatus} />
          ) : activeTab === "dealers" ? (
            <DealerTable data={data as DealerRow[]} onToggle={toggleStatus} />
          ) : activeTab === "subDealers" ? (
            <SubDealerTable data={data as SubDealerRow[]} onToggle={toggleStatus} />
          ) : activeTab === "employees" ? (
            <EmployeeTable data={data as EmployeeRow[]} onToggle={toggleStatus} />
          ) : (
            <PriceGroupTable data={data as PriceGroupRow[]} onToggle={toggleStatus} />
          )}

          {/* Pagination */}
          {meta.total > meta.pageSize && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Toplam {meta.total} kayıt — Sayfa {meta.page} / {Math.ceil(meta.total / meta.pageSize)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setMeta((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={meta.page >= Math.ceil(meta.total / meta.pageSize)}
                  onClick={() => setMeta((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Table Components ───

function DistributorTable({ data, onToggle }: { data: DistributorRow[]; onToggle: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kod</TableHead>
          <TableHead>İsim</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Bakiye</TableHead>
          <TableHead>Komisyon</TableHead>
          <TableHead>Fiyat Grubu</TableHead>
          <TableHead>Bayi / Alt Bayi</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.code}</TableCell>
            <TableCell>{d.name}</TableCell>
            <TableCell>{d.email}</TableCell>
            <TableCell>{Number(d.balance ?? 0).toLocaleString("tr-TR")} ₺</TableCell>
            <TableCell>%{Number(d.commissionRate ?? 0)}</TableCell>
            <TableCell>{d.priceGroup?.name ?? "-"}</TableCell>
            <TableCell>{d._count?.dealers ?? 0} / {d._count?.subDealers ?? 0}</TableCell>
            <TableCell>{statusBadge(d.isActive)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onToggle(d.id)}>
                {d.isActive ? "Pasif Yap" : "Aktif Yap"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DealerTable({ data, onToggle }: { data: DealerRow[]; onToggle: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kod</TableHead>
          <TableHead>İsim</TableHead>
          <TableHead>Distribütör</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Bakiye</TableHead>
          <TableHead>Komisyon</TableHead>
          <TableHead>Fiyat Grubu</TableHead>
          <TableHead>Alt Bayi</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.code}</TableCell>
            <TableCell>{d.name}</TableCell>
            <TableCell>{d.distributor?.name ?? "-"}</TableCell>
            <TableCell>{d.email}</TableCell>
            <TableCell>{Number(d.balance ?? 0).toLocaleString("tr-TR")} ₺</TableCell>
            <TableCell>%{Number(d.commissionRate ?? 0)}</TableCell>
            <TableCell>{d.priceGroup?.name ?? "-"}</TableCell>
            <TableCell>{d._count?.subDealers ?? 0}</TableCell>
            <TableCell>{statusBadge(d.isActive)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onToggle(d.id)}>
                {d.isActive ? "Pasif Yap" : "Aktif Yap"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SubDealerTable({ data, onToggle }: { data: SubDealerRow[]; onToggle: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kod</TableHead>
          <TableHead>İsim</TableHead>
          <TableHead>Distribütör</TableHead>
          <TableHead>Bayi</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Bakiye</TableHead>
          <TableHead>Komisyon</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.code}</TableCell>
            <TableCell>{d.name}</TableCell>
            <TableCell>{d.distributor?.name ?? "-"}</TableCell>
            <TableCell>{d.dealer?.name ?? "-"}</TableCell>
            <TableCell>{d.email}</TableCell>
            <TableCell>{Number(d.balance ?? 0).toLocaleString("tr-TR")} ₺</TableCell>
            <TableCell>%{Number(d.commissionRate ?? 0)}</TableCell>
            <TableCell>{statusBadge(d.isActive)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onToggle(d.id)}>
                {d.isActive ? "Pasif Yap" : "Aktif Yap"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmployeeTable({ data, onToggle }: { data: EmployeeRow[]; onToggle: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>İsim</TableHead>
          <TableHead>E-posta</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Bağlı Olduğu</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
            <TableCell>{e.email}</TableCell>
            <TableCell>{ROLE_LABELS[e.role] ?? e.role}</TableCell>
            <TableCell>
              {e.distributor?.name ?? e.dealer?.name ?? e.subDealer?.name ?? "-"}
            </TableCell>
            <TableCell>{statusBadge(e.isActive)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onToggle(e.id)}>
                {e.isActive ? "Pasif Yap" : "Aktif Yap"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PriceGroupTable({ data, onToggle }: { data: PriceGroupRow[]; onToggle: (id: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>İsim</TableHead>
          <TableHead>Kar Marjı</TableHead>
          <TableHead>Kullanım</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((pg) => (
          <TableRow key={pg.id}>
            <TableCell className="font-medium">{pg.name}</TableCell>
            <TableCell>%{Number(pg.markupPercent)}</TableCell>
            <TableCell>
              {pg._count
                ? `${pg._count.distributors} Dist / ${pg._count.dealers} Bayi / ${pg._count.subDealers} Alt Bayi`
                : "-"}
            </TableCell>
            <TableCell>{statusBadge(pg.isActive)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onToggle(pg.id)}>
                {pg.isActive ? "Pasif Yap" : "Aktif Yap"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
