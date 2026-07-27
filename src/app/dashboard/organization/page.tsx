

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import {
  Building2, Building, Users, UserPlus, Search, RefreshCw,
  DollarSign, Percent, Tag, Pencil,
} from "lucide-react";

// ─── Types ───

interface EntityBase {
  id: string;
  name: string;
  code: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  balance?: number;
  commissionRate?: number;
  priceGroup?: { id: string; name: string } | null;
  priceGroupId?: string | null;
  _count?: Record<string, number>;
  createdAt: string;
}

interface DistributorRow extends EntityBase {
  _count?: { dealers: number; subDealers: number; users: number; customers: number };
}

interface DealerRow extends EntityBase {
  distributor?: { id: string; name: string } | null;
  distributorId?: string | null;
  _count?: { subDealers: number; users: number; customers: number };
}

interface SubDealerRow extends EntityBase {
  dealer?: { id: string; name: string } | null;
  distributor?: { id: string; name: string } | null;
  dealerId?: string | null;
  _count?: { users: number; customers: number };
}

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  distributorId?: string | null;
  dealerId?: string | null;
  subDealerId?: string | null;
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

type Tab = "distributors" | "dealers" | "sub-dealers" | "employees" | "price-groups";

// ─── Form types ───

interface DistributorForm {
  name: string; code: string; email: string; phone: string;
  address: string; commissionRate: number; priceGroupId: string; balance: number;
}
interface DealerForm {
  name: string; code: string; email: string; phone: string;
  address: string; commissionRate: number; priceGroupId: string; distributorId: string; balance: number;
}
interface SubDealerForm {
  name: string; code: string; email: string; phone: string;
  address: string; commissionRate: number; priceGroupId: string; distributorId: string; dealerId: string; balance: number;
}
interface EmployeeForm {
  firstName: string; lastName: string; email: string; password: string;
  role: string; distributorId: string; dealerId: string; subDealerId: string;
}
interface PriceGroupForm {
  name: string; markupPercent: number;
}

const EMPTY_DIST: DistributorForm = { name: "", code: "", email: "", phone: "", address: "", commissionRate: 0, priceGroupId: "", balance: 0 };
const EMPTY_DEALER: DealerForm = { ...EMPTY_DIST, distributorId: "" };
const EMPTY_SUB: SubDealerForm = { ...EMPTY_DEALER, dealerId: "" };
const EMPTY_EMP: EmployeeForm = { firstName: "", lastName: "", email: "", password: "", role: "EMPLOYEE", distributorId: "", dealerId: "", subDealerId: "" };
const EMPTY_PG: PriceGroupForm = { name: "", markupPercent: 0 };

// ─── Helpers ───

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Çalışan",
  DISTRIBUTOR_STAFF: "Distribütör Personel",
  DEALER_STAFF: "Bayi Personel",
  SUB_DEALER_STAFF: "Alt Bayi Personel",
};

const ROLE_OPTIONS = [
  { value: "EMPLOYEE", label: "Çalışan" },
  { value: "DISTRIBUTOR_STAFF", label: "Distribütör Personel" },
  { value: "DEALER_STAFF", label: "Bayi Personel" },
  { value: "SUB_DEALER_STAFF", label: "Alt Bayi Personel" },
];

function statusBadge(active: boolean) {
  return active
    ? <Badge className="bg-emerald-100 text-emerald-700">Aktif</Badge>
    : <Badge className="bg-red-100 text-red-700">Pasif</Badge>;
}

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "distributors", label: "Distribütörler", icon: Building2 },
  { key: "dealers", label: "Bayiler", icon: Building },
  { key: "sub-dealers", label: "Alt Bayiler", icon: Building },
  { key: "employees", label: "Personel", icon: Users },
  { key: "price-groups", label: "Fiyat Grupları", icon: Tag },
];

// ─── Page ───

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("distributors");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<unknown[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<unknown | null>(null);

  // form states
  const [df, setDf] = useState<DistributorForm>(EMPTY_DIST);
  const [dlf, setDlf] = useState<DealerForm>(EMPTY_DEALER);
  const [sf, setSf] = useState<SubDealerForm>(EMPTY_SUB);
  const [ef, setEf] = useState<EmployeeForm>(EMPTY_EMP);
  const [pf, setPf] = useState<PriceGroupForm>(EMPTY_PG);
  const [saving, setSaving] = useState(false);

  // reference data
  const [distributors, setDistributors] = useState<{ value: string; label: string }[]>([]);
  const [dealers, setDealers] = useState<{ value: string; label: string }[]>([]);
  const [priceGroups, setPriceGroups] = useState<{ value: string; label: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(meta.page));
    params.set("pageSize", String(meta.pageSize));
    const url = `/api/v1/${activeTab}?${params}`;
    const res = await fetch(url, { credentials: "include" });
    const json = await res.json();
    if (json.success) { setData(json.data); setMeta(json.meta); }
    setLoading(false);
  }, [activeTab, search, meta.page, meta.pageSize]);

  // load reference data
  const loadRefs = useCallback(async () => {
    const [dr, dlr, pgr] = await Promise.all([
      fetch("/api/v1/distributors?pageSize=200", { credentials: "include" }).then(r => r.json()),
      fetch("/api/v1/dealers?pageSize=200", { credentials: "include" }).then(r => r.json()),
      fetch("/api/v1/price-groups?pageSize=200", { credentials: "include" }).then(r => r.json()),
    ]);
    if (dr.success) setDistributors(dr.data.map((d: { id: string; name: string }) => ({ value: d.id, label: d.name })));
    if (dlr.success) setDealers(dlr.data.map((d: { id: string; name: string }) => ({ value: d.id, label: d.name })));
    if (pgr.success) setPriceGroups(pgr.data.map((p: { id: string; name: string }) => ({ value: p.id, label: p.name })));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { loadRefs(); }, [loadRefs]);

  const toggleStatus = async (id: string) => {
    await fetch(`/api/v1/${activeTab}/${id}/toggle-status`, { method: "POST", credentials: "include" });
    fetchData();
  };

  const openAdd = () => {
    setEditItem(null);
    setDf(EMPTY_DIST); setDlf(EMPTY_DEALER); setSf(EMPTY_SUB); setEf(EMPTY_EMP); setPf(EMPTY_PG);
    setModalOpen(true);
  };

  const openEdit = (item: unknown) => {
    setEditItem(item);
    const i = item as Record<string, unknown>;
    if (activeTab === "distributors") setDf({ name: i.name as string, code: i.code as string, email: i.email as string, phone: (i.phone as string) ?? "", address: (i.address as string) ?? "", commissionRate: Number(i.commissionRate ?? 0), priceGroupId: (i.priceGroupId as string) ?? "", balance: Number(i.balance ?? 0) });
    else if (activeTab === "dealers") setDlf({ name: i.name as string, code: i.code as string, email: i.email as string, phone: (i.phone as string) ?? "", address: (i.address as string) ?? "", commissionRate: Number(i.commissionRate ?? 0), priceGroupId: (i.priceGroupId as string) ?? "", distributorId: (i.distributorId as string) ?? "", balance: Number(i.balance ?? 0) });
    else if (activeTab === "sub-dealers") setSf({ name: i.name as string, code: i.code as string, email: i.email as string, phone: (i.phone as string) ?? "", address: (i.address as string) ?? "", commissionRate: Number(i.commissionRate ?? 0), priceGroupId: (i.priceGroupId as string) ?? "", distributorId: (i.distributorId as string) ?? "", dealerId: (i.dealerId as string) ?? "", balance: Number(i.balance ?? 0) });
    else if (activeTab === "employees") setEf({ firstName: i.firstName as string, lastName: i.lastName as string, email: i.email as string, password: "", role: i.role as string, distributorId: (i.distributorId as string) ?? "", dealerId: (i.dealerId as string) ?? "", subDealerId: (i.subDealerId as string) ?? "" });
    else if (activeTab === "price-groups") setPf({ name: i.name as string, markupPercent: Number(i.markupPercent ?? 0) });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    let body: Record<string, unknown> = {};
    let id: string | null = null;
    if (editItem) id = (editItem as Record<string, string>).id;

    if (activeTab === "distributors") body = { ...df, commissionRate: Number(df.commissionRate), balance: Number(df.balance), priceGroupId: df.priceGroupId || null };
    else if (activeTab === "dealers") body = { ...dlf, commissionRate: Number(dlf.commissionRate), balance: Number(dlf.balance), distributorId: dlf.distributorId || null, priceGroupId: dlf.priceGroupId || null };
    else if (activeTab === "sub-dealers") body = { ...sf, commissionRate: Number(sf.commissionRate), balance: Number(sf.balance), distributorId: sf.distributorId || null, dealerId: sf.dealerId || null, priceGroupId: sf.priceGroupId || null };
    else if (activeTab === "employees") body = { ...ef, password: ef.password || undefined, distributorId: ef.distributorId || null, dealerId: ef.dealerId || null, subDealerId: ef.subDealerId || null };
    else if (activeTab === "price-groups") body = { ...pf, markupPercent: Number(pf.markupPercent) };

    const method = id ? "PATCH" : "POST";
    const url = id ? `/api/v1/${activeTab}/${id}` : `/api/v1/${activeTab}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      setModalOpen(false);
      fetchData();
    } else {
      alert(json.error?.message ?? json.error ?? "Hata oluştu");
    }
    setSaving(false);
  };

  const modalTitle = editItem ? "Düzenle" : "Yeni Ekle";

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
        <Button className="ml-auto" onClick={openAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yeni {TABS.find((t) => t.key === activeTab)?.label?.replace(/ler$/, "").replace(/lar$/, "")} Ekle
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
            <DistributorTable data={data as DistributorRow[]} onToggle={toggleStatus} onEdit={openEdit} />
          ) : activeTab === "dealers" ? (
            <DealerTable data={data as DealerRow[]} onToggle={toggleStatus} onEdit={openEdit} />
          ) : activeTab === "sub-dealers" ? (
            <SubDealerTable data={data as SubDealerRow[]} onToggle={toggleStatus} onEdit={openEdit} />
          ) : activeTab === "employees" ? (
            <EmployeeTable data={data as EmployeeRow[]} onToggle={toggleStatus} onEdit={openEdit} />
          ) : (
            <PriceGroupTable data={data as PriceGroupRow[]} onToggle={toggleStatus} onEdit={openEdit} />
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

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalTitle} {TABS.find((t) => t.key === activeTab)?.label?.replace(/ler$/, "").replace(/lar$/, "")}</DialogTitle>
            <DialogDescription>Bilgileri doldurup kaydedin</DialogDescription>
          </DialogHeader>
          <DialogClose />

          <div className="flex flex-col gap-3 py-2">
            {renderForm()}
          </div>

          <DialogFooter>
            <DialogClose variant="button" onClick={() => setModalOpen(false)} />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderForm() {
    if (activeTab === "distributors") return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Kod</Label><Input value={df.code} onChange={e => setDf({...df, code: e.target.value})} /></div>
          <div><Label>İsim</Label><Input value={df.name} onChange={e => setDf({...df, name: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>E-posta</Label><Input type="email" value={df.email} onChange={e => setDf({...df, email: e.target.value})} /></div>
          <div><Label>Telefon</Label><Input value={df.phone} onChange={e => setDf({...df, phone: e.target.value})} /></div>
        </div>
        <div><Label>Adres</Label><Input value={df.address} onChange={e => setDf({...df, address: e.target.value})} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Bakiye</Label><Input type="number" value={df.balance} onChange={e => setDf({...df, balance: Number(e.target.value)})} /></div>
          <div><Label>Komisyon %</Label><Input type="number" value={df.commissionRate} onChange={e => setDf({...df, commissionRate: Number(e.target.value)})} /></div>
          <div><Label>Fiyat Grubu</Label><Combobox options={priceGroups} value={df.priceGroupId} onChange={v => setDf({...df, priceGroupId: v})} placeholder="Seçiniz..." /></div>
        </div>
      </>
    );

    if (activeTab === "dealers") return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Kod</Label><Input value={dlf.code} onChange={e => setDlf({...dlf, code: e.target.value})} /></div>
          <div><Label>İsim</Label><Input value={dlf.name} onChange={e => setDlf({...dlf, name: e.target.value})} /></div>
        </div>
        <div><Label>Distribütör</Label><Combobox options={distributors} value={dlf.distributorId} onChange={v => setDlf({...dlf, distributorId: v})} placeholder="Distribütör seçin..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>E-posta</Label><Input type="email" value={dlf.email} onChange={e => setDlf({...dlf, email: e.target.value})} /></div>
          <div><Label>Telefon</Label><Input value={dlf.phone} onChange={e => setDlf({...dlf, phone: e.target.value})} /></div>
        </div>
        <div><Label>Adres</Label><Input value={dlf.address} onChange={e => setDlf({...dlf, address: e.target.value})} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Bakiye</Label><Input type="number" value={dlf.balance} onChange={e => setDlf({...dlf, balance: Number(e.target.value)})} /></div>
          <div><Label>Komisyon %</Label><Input type="number" value={dlf.commissionRate} onChange={e => setDlf({...dlf, commissionRate: Number(e.target.value)})} /></div>
          <div><Label>Fiyat Grubu</Label><Combobox options={priceGroups} value={dlf.priceGroupId} onChange={v => setDlf({...dlf, priceGroupId: v})} placeholder="Seçiniz..." /></div>
        </div>
      </>
    );

    if (activeTab === "sub-dealers") return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Kod</Label><Input value={sf.code} onChange={e => setSf({...sf, code: e.target.value})} /></div>
          <div><Label>İsim</Label><Input value={sf.name} onChange={e => setSf({...sf, name: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Distribütör</Label><Combobox options={distributors} value={sf.distributorId} onChange={v => setSf({...sf, distributorId: v, dealerId: ""})} placeholder="Distribütör seçin..." /></div>
          <div><Label>Bayi</Label><Combobox options={dealers} value={sf.dealerId} onChange={v => setSf({...sf, dealerId: v})} placeholder="Bayi seçin..." /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>E-posta</Label><Input type="email" value={sf.email} onChange={e => setSf({...sf, email: e.target.value})} /></div>
          <div><Label>Telefon</Label><Input value={sf.phone} onChange={e => setSf({...sf, phone: e.target.value})} /></div>
        </div>
        <div><Label>Adres</Label><Input value={sf.address} onChange={e => setSf({...sf, address: e.target.value})} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Bakiye</Label><Input type="number" value={sf.balance} onChange={e => setSf({...sf, balance: Number(e.target.value)})} /></div>
          <div><Label>Komisyon %</Label><Input type="number" value={sf.commissionRate} onChange={e => setSf({...sf, commissionRate: Number(e.target.value)})} /></div>
          <div><Label>Fiyat Grubu</Label><Combobox options={priceGroups} value={sf.priceGroupId} onChange={v => setSf({...sf, priceGroupId: v})} placeholder="Seçiniz..." /></div>
        </div>
      </>
    );

    if (activeTab === "employees") return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Ad</Label><Input value={ef.firstName} onChange={e => setEf({...ef, firstName: e.target.value})} /></div>
          <div><Label>Soyad</Label><Input value={ef.lastName} onChange={e => setEf({...ef, lastName: e.target.value})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>E-posta</Label><Input type="email" value={ef.email} onChange={e => setEf({...ef, email: e.target.value})} /></div>
          <div><Label>{editItem ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre"}</Label><Input type="password" value={ef.password} onChange={e => setEf({...ef, password: e.target.value})} /></div>
        </div>
        <div><Label>Rol</Label><Combobox options={ROLE_OPTIONS} value={ef.role} onChange={v => setEf({...ef, role: v})} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Distribütör</Label><Combobox options={distributors} value={ef.distributorId} onChange={v => setEf({...ef, distributorId: v, dealerId: "", subDealerId: ""})} placeholder="İsteğe bağlı" /></div>
          <div><Label>Bayi</Label><Combobox options={dealers} value={ef.dealerId} onChange={v => setEf({...ef, dealerId: v, subDealerId: ""})} placeholder="İsteğe bağlı" /></div>
          <div><Label>Alt Bayi</Label><Combobox
            options={dealers.length > 0 ? [{value: "", label: "Seçiniz..."}] : []}
            value={ef.subDealerId} onChange={v => setEf({...ef, subDealerId: v})} placeholder="İsteğe bağlı"
          /></div>
        </div>
      </>
    );

    if (activeTab === "price-groups") return (
      <>
        <div><Label>İsim</Label><Input value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} /></div>
        <div><Label>Kar Marjı %</Label><Input type="number" value={pf.markupPercent} onChange={e => setPf({...pf, markupPercent: Number(e.target.value)})} /></div>
      </>
    );

    return null;
  }
}

// ─── Table Components ───

function DistributorTable({ data, onToggle, onEdit }: { data: DistributorRow[]; onToggle: (id: string) => void; onEdit: (item: DistributorRow) => void }) {
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
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onToggle(d.id)}>
                  {d.isActive ? "Pasif Yap" : "Aktif Yap"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DealerTable({ data, onToggle, onEdit }: { data: DealerRow[]; onToggle: (id: string) => void; onEdit: (item: DealerRow) => void }) {
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
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onToggle(d.id)}>
                  {d.isActive ? "Pasif Yap" : "Aktif Yap"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SubDealerTable({ data, onToggle, onEdit }: { data: SubDealerRow[]; onToggle: (id: string) => void; onEdit: (item: SubDealerRow) => void }) {
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
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(d)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onToggle(d.id)}>
                  {d.isActive ? "Pasif Yap" : "Aktif Yap"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmployeeTable({ data, onToggle, onEdit }: { data: EmployeeRow[]; onToggle: (id: string) => void; onEdit: (item: EmployeeRow) => void }) {
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
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(e)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onToggle(e.id)}>
                  {e.isActive ? "Pasif Yap" : "Aktif Yap"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PriceGroupTable({ data, onToggle, onEdit }: { data: PriceGroupRow[]; onToggle: (id: string) => void; onEdit: (item: PriceGroupRow) => void }) {
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
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(pg)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onToggle(pg.id)}>
                  {pg.isActive ? "Pasif Yap" : "Aktif Yap"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

