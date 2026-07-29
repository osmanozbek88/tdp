"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Download,
  Pencil,
  Check,
  X,
  Package,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ─── Tipler ───

interface Product {
  id: string;
  telnaProductId: string;
  name: string;
  description: string | null;
  type: string;
  country: string;
  region: string | null;
  currency: string;
  price: number;
  costPrice: number | null;
  dataGB: number | null;
  durationDays: number | null;
  dealerPrice: number | null;
  profitMargin: number | null;
  specifications: any;
  isActive: boolean;
  createdAt: string;
}

interface SyncResult {
  created: number;
  updated: number;
  total: number;
  errors: string[];
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

// ─── Yardımcılar ───

function formatPrice(price: number | null | undefined, currency?: string): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency || "USD",
  }).format(price);
}

function formatGB(gb: number | null | undefined): string {
  if (gb == null) return "Sınırsız";
  return `${gb} GB`;
}

function formatDays(days: number | null | undefined): string {
  if (days == null) return "—";
  return `${days} Gün`;
}

// ─── Ana Sayfa ───

export default function ProductsPage() {
  const router = useRouter();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "true" | "false">("all");
  const [gbMin, setGbMin] = useState("");
  const [gbMax, setGbMax] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editDealerPrice, setEditDealerPrice] = useState("");
  const [editProfitMargin, setEditProfitMargin] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ─── Veri Çekme ───

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterCountry) params.set("country", filterCountry);
      if (filterActive !== "all") params.set("isActive", filterActive);
      if (gbMin) params.set("gbMin", gbMin);
      if (gbMax) params.set("gbMax", gbMax);
      if (priceMin) params.set("priceMin", priceMin);
      if (priceMax) params.set("priceMax", priceMax);
      params.set("page", String(meta.page));
      params.set("pageSize", String(meta.pageSize));

      const res = await fetch(`/api/v1/products?${params}`, { credentials: "include" });
      const json = await res.json();

      if (json.success) {
        setProducts(json.data);
        setMeta(json.meta);
      }
    } catch (err) {
      console.error("Ürünler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterCountry, filterActive, gbMin, gbMax, priceMin, priceMax, meta.page, meta.pageSize]);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/products/countries", { credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setCountries(json.data);
      }
    } catch (err) {
      console.error("Ülkeler yüklenemedi:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // ─── Senkronizasyon ───

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/v1/products/sync", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        setSyncResult(json.data);
        fetchProducts();
        fetchCountries();
      }
    } catch (err) {
      console.error("Senkronizasyon hatası:", err);
    } finally {
      setSyncing(false);
    }
  };

  // ─── Filtre Sıfırlama ───

  const handleSearch = () => {
    setSearch(searchInput);
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setFilterCountry("");
    setFilterActive("all");
    setGbMin("");
    setGbMax("");
    setPriceMin("");
    setPriceMax("");
    setMeta((m) => ({ ...m, page: 1 }));
  };

  // ─── Düzenleme Modalı ───

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setEditDealerPrice(product.dealerPrice != null ? String(product.dealerPrice) : "");
    setEditProfitMargin(product.profitMargin != null ? String(product.profitMargin) : "");
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editProduct) return;
    setEditSaving(true);
    try {
      const body: Record<string, number | boolean> = {};
      const dp = parseFloat(editDealerPrice);
      const pm = parseFloat(editProfitMargin);

      if (!isNaN(dp) && dp >= 0) body.dealerPrice = dp;
      if (!isNaN(pm) && pm >= 0) body.profitMargin = pm;

      const res = await fetch(`/api/v1/products/${editProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setEditOpen(false);
        setEditProduct(null);
        fetchProducts();
      }
    } catch (err) {
      console.error("Güncelleme hatası:", err);
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const res = await fetch(`/api/v1/products/${product.id}/toggle-status`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        fetchProducts();
      }
    } catch (err) {
      console.error("Durum değiştirme hatası:", err);
    }
  };

  // ─── Sayfalama ───

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  const handlePage = (dir: "prev" | "next") => {
    setMeta((m) => ({
      ...m,
      page: dir === "prev" ? Math.max(1, m.page - 1) : Math.min(totalPages, m.page + 1),
    }));
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* Başlık + Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ürün Yönetimi</h1>
          <p className="text-muted-foreground">
            Provider&apos;dan senkronize edilen ürün kataloğu
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          className="gap-2"
          size="lg"
        >
          <Download className={cn("h-5 w-5", syncing && "animate-spin")} />
          {syncing ? "Senkronize ediliyor..." : "Senkronize Et"}
        </Button>
      </div>

      {/* Sync Sonucu */}
      {syncResult && (
        <div
          className={cn(
            "rounded-lg p-4 text-sm",
            syncResult.errors.length === 0
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
          )}
        >
          <p className="font-medium">
            Senkronizasyon tamamlandı: {syncResult.total} ürün
            <span className="ml-2 font-normal">
              ({syncResult.created} yeni, {syncResult.updated} güncellendi)
            </span>
          </p>
          {syncResult.errors.length > 0 && (
            <ul className="mt-2 list-disc list-inside">
              {syncResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            {/* Arama */}
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Arama</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün adı, ülke..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Ülke filtresi */}
            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Ülke</Label>
              <select
                value={filterCountry}
                onChange={(e) => {
                  setFilterCountry(e.target.value);
                  setMeta((m) => ({ ...m, page: 1 }));
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Tümü</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* GB aralığı */}
            <div className="flex items-end gap-1">
              <div className="w-[80px]">
                <Label className="text-xs text-muted-foreground mb-1 block">Min GB</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={gbMin}
                  onChange={(e) => {
                    setGbMin(e.target.value);
                    setMeta((m) => ({ ...m, page: 1 }));
                  }}
                />
              </div>
              <span className="pb-2 text-muted-foreground">—</span>
              <div className="w-[80px]">
                <Label className="text-xs text-muted-foreground mb-1 block">Max GB</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={gbMax}
                  onChange={(e) => {
                    setGbMax(e.target.value);
                    setMeta((m) => ({ ...m, page: 1 }));
                  }}
                />
              </div>
            </div>

            {/* Fiyat aralığı */}
            <div className="flex items-end gap-1">
              <div className="w-[110px]">
                <Label className="text-xs text-muted-foreground mb-1 block">Min Fiyat</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={priceMin}
                  onChange={(e) => {
                    setPriceMin(e.target.value);
                    setMeta((m) => ({ ...m, page: 1 }));
                  }}
                />
              </div>
              <span className="pb-2 text-muted-foreground">—</span>
              <div className="w-[110px]">
                <Label className="text-xs text-muted-foreground mb-1 block">Max Fiyat</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="∞"
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(e.target.value);
                    setMeta((m) => ({ ...m, page: 1 }));
                  }}
                />
              </div>
            </div>

            {/* Durum filtresi */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Durum</Label>
              <div className="flex rounded-md border border-input p-0.5 gap-0.5">
                {([
                  ["all", "Tümü"],
                  ["true", "Aktif"],
                  ["false", "Pasif"],
                ] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setFilterActive(val);
                      setMeta((m) => ({ ...m, page: 1 }));
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                      filterActive === val
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sıfırla */}
            <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Filtreleri sıfırla">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ürün Tablosu */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ürün Kataloğu
            {!loading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({meta.total} ürün)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Henüz ürün bulunmuyor</p>
              <p className="text-sm mt-1">
                Provider&apos;dan ürünleri senkronize etmek için &quot;Senkronize Et&quot; butonunu kullanın
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün Adı</TableHead>
                    <TableHead>Ülke</TableHead>
                    <TableHead>Bölge</TableHead>
                    <TableHead className="text-right">GB</TableHead>
                    <TableHead className="text-right">Gün</TableHead>
                    <TableHead className="text-right">Sağlayıcı Fiyatı</TableHead>
                    <TableHead className="text-right">Bayi Fiyatı</TableHead>
                    <TableHead className="text-right">Kar Oranı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.telnaProductId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {product.country}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {product.region || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatGB(product.dataGB)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatDays(product.durationDays)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(product.price, product.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={cn(product.dealerPrice ? "font-medium" : "text-muted-foreground")}>
                          {formatPrice(product.dealerPrice, product.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {product.profitMargin != null ? (
                          <Badge variant="secondary">%{product.profitMargin}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.isActive ? "default" : "destructive"}
                          className={cn(
                            product.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                              : ""
                          )}
                        >
                          {product.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(product)}
                            title="Fiyatlandırmayı düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(product)}
                          >
                            {product.isActive ? "Pasif Yap" : "Aktif Yap"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {meta.total > meta.pageSize && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Toplam {meta.total} kayıt — Sayfa {meta.page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => handlePage("prev")}
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= totalPages}
                  onClick={() => handlePage("next")}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Düzenleme Modalı */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ürün Fiyatlandırması</DialogTitle>
            <DialogDescription>
              {editProduct?.name} için bayi fiyatı ve kar oranı ayarlayın.
            </DialogDescription>
          </DialogHeader>

          {editProduct && (
            <div className="space-y-4 py-4">
              {/* Mevcut bilgiler */}
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sağlayıcı Fiyatı:</span>
                  <span className="font-medium">{formatPrice(editProduct.price, editProduct.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ülke / Bölge:</span>
                  <span>{editProduct.country}{editProduct.region ? ` / ${editProduct.region}` : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GB / Gün:</span>
                  <span>{formatGB(editProduct.dataGB)} / {formatDays(editProduct.durationDays)}</span>
                </div>
              </div>

              {/* Bayi Fiyatı */}
              <div className="space-y-2">
                <Label htmlFor="dealerPrice">Bayi Fiyatı ({editProduct.currency})</Label>
                <Input
                  id="dealerPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={formatPrice(editProduct.price)}
                  value={editDealerPrice}
                  onChange={(e) => setEditDealerPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Bayilere gösterilecek satış fiyatı. Boş bırakılırsa sağlayıcı fiyatı kullanılır.
                </p>
              </div>

              {/* Kar Oranı */}
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Kar Oranı (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  step="0.1"
                  min="0"
                  max="999"
                  placeholder="0"
                  value={editProfitMargin}
                  onChange={(e) => setEditProfitMargin(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Yüzde olarak kar marjı. Örn: 25 = %25 kar.
                </p>
              </div>

              {/* Hesaplanan fiyat önizlemesi */}
              {editDealerPrice && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Hesaplanan Kar:</span>
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      {formatPrice(
                        parseFloat(editDealerPrice) - (editProduct.price || 0),
                        editProduct.currency
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
