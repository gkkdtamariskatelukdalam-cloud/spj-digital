"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
  Trash2,
  Package,
  Store,
  CalendarDays,
  Hash,
  Printer,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentPreview, CetakMenuButton } from "@/components/spj/document-preview";
import {
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
  useVendors,
  useCreateTransaction,
} from "@/hooks/use-spj";
import type { Transaction } from "@/lib/types/spj";
import { formatRupiah, formatDate, formatDateShort, getMonthName } from "@/lib/format";

// === Group type: 1 No. Pesanan = 1 group with multiple items ===
export interface PesananGroup {
  key: string;
  noPesan: string;
  noBku: string;
  tglPesan: string | null;
  tglBayar: string | null;
  vendorName: string | null;
  items: Transaction[];
  totalJumlah: number;
  itemCount: number;
  status: string; // draft if any item is draft, else lunas/pending
  bulan: number | null;
}

// Convert PesananGroup to DocumentGroup (for document preview)
function pesananGroupToDocGroup(g: PesananGroup): import("@/lib/types/spj").DocumentGroup {
  return {
    key: g.key,
    noPesan: g.noPesan,
    noBku: g.noBku,
    bpuCode: g.noBku,
    tglPesan: g.tglPesan,
    tglBast: g.items[0]?.tglBast || null,
    tglBayar: g.tglBayar,
    bulan: g.bulan,
    tahun: g.items[0]?.tahun || 2025,
    vendorId: g.items[0]?.vendorId || null,
    vendorName: g.vendorName,
    vendorOwner: g.items[0]?.direkturToko1 || g.items[0]?.vendor?.owner || null,
    vendorPhone: g.items[0]?.noHp || g.items[0]?.vendor?.phone || null,
    vendorAddress: g.items[0]?.alamatToko1 || g.items[0]?.vendor?.address || null,
    items: g.items.map((t) => ({
      id: t.id,
      uraian: t.uraian,
      namaBarang: t.namaBarang,
      volume: t.volume,
      satuan: t.satuan,
      tarifHarga: t.tarifHarga,
      jumlah: t.jumlah,
      realisasi: t.realisasi,
      noBku: t.noBku,
      noBast: t.noBast,
      tglBayar: t.tglBayar,
    })),
    totalJumlah: g.totalJumlah,
    totalRealisasi: g.totalJumlah,
    itemCount: g.itemCount,
  };
}

export function DataBelanja() {
  const [search, setSearch] = useState("");
  const [bulanFilter, setBulanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  
  // Preview state
  const [previewGroup, setPreviewGroup] = useState<PesananGroup | null>(null);
  const [previewMode, setPreviewMode] = useState<"single" | "all" | "vendor">("single");
  const [previewAllGroups, setPreviewAllGroups] = useState<PesananGroup[]>([]);
  const [previewDocId, setPreviewDocId] = useState<string | undefined>(undefined);
  const [showPreview, setShowPreview] = useState(false);
  const [showVendorMenu, setShowVendorMenu] = useState(false);
  const [previewVendorName, setPreviewVendorName] = useState<string | null>(null);

  const bulan = bulanFilter === "all" ? undefined : parseInt(bulanFilter);
  const status = statusFilter === "all" ? undefined : statusFilter;

  // Fetch ALL transactions (high limit to get everything)
  const { data, isLoading, error } = useTransactions({
    q: search || undefined,
    bulan,
    status,
    limit: 2000,
  });

  const allTransactions = data?.transactions ?? [];

  // Group transactions by noPesan (fallback to noBku, then to a unique key)
  const groups = useMemo<PesananGroup[]>(() => {
    const map = new Map<string, PesananGroup>();

    for (const tx of allTransactions) {
      const key = tx.noPesan || tx.noBku || `tx-${tx.id}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          noPesan: tx.noPesan || "",
          noBku: tx.noBku || "",
          tglPesan: tx.tglPesan,
          tglBayar: tx.tglBayar,
          vendorName: tx.vendor?.name || tx.namaToko1 || null,
          items: [],
          totalJumlah: 0,
          itemCount: 0,
          status: "pending",
          bulan: tx.bulan,
        });
      }

      const group = map.get(key)!;
      group.items.push(tx);
      group.totalJumlah += tx.jumlah || 0;
      group.itemCount += 1;

      // Update group status: draft if any item is draft
      if (tx.status === "draft") {
        group.status = "draft";
      } else if (group.status !== "draft" && tx.status === "lunas") {
        group.status = "lunas";
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Sort by bulan then noPesan
      if (a.bulan !== b.bulan) return (a.bulan || 99) - (b.bulan || 99);
      return a.noPesan.localeCompare(b.noPesan);
    });
  }, [allTransactions]);

  // Compute stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const draftGroups = groups.filter((g) => g.status === "draft").length;
    const pendingGroups = groups.filter((g) => g.status === "pending").length;
    const lunasGroups = groups.filter((g) => g.status === "lunas").length;
    const totalNilai = groups.reduce((s, g) => s + g.totalJumlah, 0);
    return { totalGroups, draftGroups, pendingGroups, lunasGroups, totalNilai };
  }, [groups]);

  // Compute vendor list with stats for "Cetak per Toko"
  const vendorList = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    for (const g of groups) {
      const name = g.vendorName || "Tanpa Vendor";
      if (!map.has(name)) {
        map.set(name, { name, count: 0, total: 0 });
      }
      const v = map.get(name)!;
      v.count += 1;
      v.total += g.totalJumlah;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [groups]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedKeys(new Set(groups.map((g) => g.key)));
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-violet-600" />
                Data Belanja
              </CardTitle>
              <CardDescription className="text-sm">
                Data belanja dikelompokkan per No. Pesanan. Klik{" "}
                <ChevronRight className="inline h-3 w-3" /> untuk melihat
 barang di dalam setiap pesanan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Cetak per Toko dropdown */}
              <div className="relative inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300"
                  onClick={() => setShowVendorMenu(!showVendorMenu)}
                >
                  <Store className="h-3.5 w-3.5 mr-1" />
                  Cetak per Toko
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                {showVendorMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowVendorMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-md border bg-popover shadow-lg max-h-96 overflow-y-auto">
                      <div className="px-2 py-1.5 border-b">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">
                          Pilih Toko/Vendor
                        </p>
                      </div>
                      {vendorList.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          Tidak ada vendor
                        </div>
                      ) : (
                        vendorList.map((v) => (
                          <button
                            key={v.name}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center justify-between gap-2"
                            onClick={() => {
                              const vendorGroups = groups.filter(
                                (g) => g.vendorName === v.name
                              );
                              setPreviewGroup(null);
                              setPreviewMode("vendor");
                              setPreviewAllGroups(vendorGroups);
                              setPreviewVendorName(v.name);
                              setPreviewDocId(undefined);
                              setShowPreview(true);
                              setShowVendorMenu(false);
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{v.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {v.count} pesanan · {formatRupiah(v.total)}
                              </div>
                            </div>
                            <Printer className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Cetak Semua SPJ */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewGroup(null);
                  setPreviewMode("all");
                  setPreviewAllGroups(groups);
                  setPreviewDocId(undefined);
                  setShowPreview(true);
                }}
                disabled={groups.length === 0}
                className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:text-rose-300"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Cetak Semua SPJ
              </Button>
              <Button onClick={() => setShowAdd(true)} size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Belanja
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total Pesanan"
          value={stats.totalGroups}
          color="text-violet-700 dark:text-violet-300"
          bg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          icon={<FileEdit className="h-4 w-4" />}
          label="Draft (Belum Lengkap)"
          value={stats.draftGroups}
          color="text-amber-700 dark:text-amber-300"
          bg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending"
          value={stats.pendingGroups}
          color="text-cyan-700 dark:text-cyan-300"
          bg="bg-cyan-50 dark:bg-cyan-950/40"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Lunas"
          value={stats.lunasGroups}
          color="text-emerald-700 dark:text-emerald-300"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      {/* Filters + Expand/Collapse All */}
      <Card>
        <CardHeader className="pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari no. pesan, BKU, uraian, nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={bulanFilter} onValueChange={setBulanFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Semua Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {getMonthName(i + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft (Belum Lengkap)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {groups.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Button variant="ghost" size="sm" onClick={expandAll} className="h-7 text-xs">
                <ChevronDown className="h-3 w-3 mr-1" />
                Buka Semua
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll} className="h-7 text-xs">
                <ChevronRight className="h-3 w-3 mr-1" />
                Tutup Semua
              </Button>
              <div className="text-xs text-muted-foreground ml-auto">
                {groups.length} pesanan · {allTransactions.length} barang · Total:{" "}
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                  {formatRupiah(stats.totalNilai)}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
              <span className="ml-2 text-sm text-muted-foreground">
                Memuat data belanja...
              </span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-rose-600">
              Gagal memuat data: {error.message}
            </div>
          ) : groups.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">Belum ada data belanja</p>
              <p className="text-xs text-muted-foreground mt-1">
                Import Excel atau tambah manual untuk mulai
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[650px]">
              {/* === MASTER TABLE: 1 row per No. Pesanan === */}
              <table className="w-full border-separate border-spacing-0 text-xs">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-card border-b">
                    <th className="w-8 p-2 border-b text-center"></th>
                    <th className="w-10 p-2 border-b text-center font-semibold">No</th>
                    <th className="w-20 p-2 border-b text-center font-semibold">No. Pesan</th>
                    <th className="w-24 p-2 border-b text-center font-semibold">No. BKU</th>
                    <th className="w-28 p-2 border-b text-center font-semibold">Tgl Pesanan</th>
                    <th className="p-2 border-b text-left font-semibold">Vendor / Toko</th>
                    <th className="w-24 p-2 border-b text-center font-semibold">Jumlah Barang</th>
                    <th className="w-36 p-2 border-b text-right font-semibold">Total Nilai</th>
                    <th className="w-24 p-2 border-b text-center font-semibold">Status</th>
                    <th className="w-32 p-2 border-b text-center font-semibold">Cetak</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, gi) => {
                    const isExpanded = expandedKeys.has(group.key);
                    return (
                      <PesananRow
                        key={group.key}
                        group={group}
                        index={gi + 1}
                        isExpanded={isExpanded}
                        onToggle={() => toggleExpand(group.key)}
                        onEditItem={(tx) => setEditingTx(tx)}
                        onCetakPreview={(g, docId) => {
                          setPreviewGroup(g);
                          setPreviewMode("single");
                          setPreviewAllGroups([]);
                          setPreviewDocId(docId);
                          setShowPreview(true);
                        }}
                      />
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingTx && (
        <EditBelanjaDialog tx={editingTx} onClose={() => setEditingTx(null)} />
      )}

      {/* Add Dialog */}
      {showAdd && <AddBelanjaDialog onClose={() => setShowAdd(false)} />}

      {/* Document Preview Modal */}
      <DocumentPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        group={previewGroup ? pesananGroupToDocGroup(previewGroup) : null}
        mode={previewMode}
        allGroups={previewAllGroups.map(pesananGroupToDocGroup)}
        vendorName={previewVendorName}
        initialDocId={previewDocId}
      />
    </div>
  );
}

// === Master Row + Detail Items ===
function PesananRow({
  group,
  index,
  isExpanded,
  onToggle,
  onEditItem,
  onCetakPreview,
}: {
  group: PesananGroup;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEditItem: (tx: Transaction) => void;
  onCetakPreview: (group: PesananGroup, docId?: string) => void;
}) {
  const isDraft = group.status === "draft";
  const isLunas = group.status === "lunas";

  return (
    <>
      {/* === Master Row === */}
      <tr
        className={cn(
          "hover:bg-muted/40 cursor-pointer transition-colors",
          isDraft && "bg-amber-50/40 dark:bg-amber-950/10",
          isExpanded && "bg-muted/60"
        )}
        onClick={onToggle}
      >
        {/* Expand/Collapse button */}
        <td className="p-2 border-b text-center">
          <button className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-violet-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-violet-600" />
            )}
          </button>
        </td>
        <td className="p-2 border-b text-center font-mono text-muted-foreground">
          {index}
        </td>
        <td className="p-2 border-b text-center font-mono font-semibold">
          {group.noPesan || "—"}
        </td>
        <td className="p-2 border-b text-center font-mono">
          <Badge variant="outline" className="text-[9px] font-mono">
            {group.noBku || "—"}
          </Badge>
        </td>
        <td className="p-2 border-b text-center">
          {group.tglPesan ? (
            formatDateShort(group.tglPesan)
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
        <td className="p-2 border-b text-left">
          <div className="flex items-center gap-1.5">
            <Store className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate" title={group.vendorName || ""}>
              {group.vendorName || (
                <span className="text-muted-foreground/40 italic">
                  Belum ada vendor
                </span>
              )}
            </span>
          </div>
        </td>
        <td className="p-2 border-b text-center">
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-violet-300 text-violet-700 dark:text-violet-300"
          >
            <Package className="h-2.5 w-2.5 mr-0.5" />
            {group.itemCount} barang
          </Badge>
        </td>
        <td className="p-2 border-b text-right font-mono font-bold text-rose-700 dark:text-rose-300">
          {group.totalJumlah > 0 ? (
            formatRupiah(group.totalJumlah)
          ) : (
            <span className="text-muted-foreground/40">—</span>
          )}
        </td>
        <td className="p-2 border-b text-center">
          {isDraft ? (
            <Badge
              variant="outline"
              className="text-[9px] border-amber-400 text-amber-700 dark:text-amber-300"
            >
              <FileEdit className="h-2.5 w-2.5 mr-0.5" />
              Draft
            </Badge>
          ) : isLunas ? (
            <Badge
              variant="outline"
              className="text-[9px] border-emerald-400 text-emerald-700 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              Lunas
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] border-cyan-400 text-cyan-700 dark:text-cyan-300"
            >
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              Pending
            </Badge>
          )}
        </td>
        {/* Cetak button cell */}
        <td className="p-2 border-b text-center" onClick={(e) => e.stopPropagation()}>
          <CetakMenuButton
            group={group}
            onPreview={(g, docId) => onCetakPreview(g, docId)}
            onDownload={(g) => onCetakPreview(g)}
            onPrint={(g) => onCetakPreview(g)}
          />
        </td>
      </tr>

      {/* === Detail Items (expanded) === */}
      {isExpanded && (
        <tr>
          <td colSpan={10} className="p-0 border-b">
            <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span>
                  Daftar Barang pada Pesanan{" "}
                  <span className="font-mono font-semibold">
                    #{group.noPesan || group.noBku}
                  </span>{" "}
                  — {group.itemCount} barang
                </span>
              </div>
              {/* Items table */}
              <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-center w-10">No</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[200px]">
                        Nama Barang <span className="text-muted-foreground font-normal">(klik untuk edit)</span>
                      </th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[200px]">Uraian Kegiatan</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-center w-20">Volume</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-center w-20">Satuan</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-right w-28">Harga Satuan</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-right w-32">Jumlah</th>
                      <th className="p-2 border border-slate-200 dark:border-slate-700 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, ii) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        index={ii + 1}
                        isDraft={item.status === "draft"}
                        onEdit={() => onEditItem(item)}
                      />
                    ))}
                  </tbody>
                  {/* Total row */}
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                      <td colSpan={6} className="p-2 border border-slate-200 dark:border-slate-700 text-right">
                        TOTAL
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700 text-right font-mono text-rose-700 dark:text-rose-300">
                        {formatRupiah(group.totalJumlah)}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-700"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// === Item Row (inside expanded group) ===
function ItemRow({
  item,
  index,
  isDraft,
  onEdit,
}: {
  item: Transaction;
  index: number;
  isDraft: boolean;
  onEdit: () => void;
}) {
  return (
    <tr
      className={cn(
        "hover:bg-violet-50/50 dark:hover:bg-violet-950/20",
        isDraft && "bg-amber-50/30 dark:bg-amber-950/10"
      )}
    >
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-mono text-muted-foreground">
        {index}
      </td>
      {/* Nama Barang - CLICKABLE */}
      <td
        className="p-2 border border-slate-200 dark:border-slate-700 cursor-pointer text-violet-700 dark:text-violet-300 hover:underline"
        onClick={onEdit}
      >
        {item.namaBarang ? (
          <span className="font-medium">{item.namaBarang}</span>
        ) : item.uraian ? (
          <span className="font-medium">{item.uraian}</span>
        ) : (
          <span className="text-muted-foreground/50 italic">
            (belum diisi) - klik untuk edit
          </span>
        )}
      </td>
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-muted-foreground">
        {item.uraian || <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-mono">
        {item.volume > 0 ? item.volume : "—"}
      </td>
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">
        {item.satuan || "—"}
      </td>
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-right font-mono">
        {item.tarifHarga > 0 ? formatRupiah(item.tarifHarga) : "—"}
      </td>
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-right font-mono font-semibold text-rose-700 dark:text-rose-300">
        {item.jumlah > 0 ? formatRupiah(item.jumlah) : "—"}
      </td>
      <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">
        {item.status === "draft" ? (
          <Badge variant="outline" className="text-[9px] border-amber-400 text-amber-700 dark:text-amber-300">
            Draft
          </Badge>
        ) : item.status === "lunas" ? (
          <Badge variant="outline" className="text-[9px] border-emerald-400 text-emerald-700 dark:text-emerald-300">
            Lunas
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] border-cyan-400 text-cyan-700 dark:text-cyan-300">
            Pending
          </Badge>
        )}
      </td>
    </tr>
  );
}

// === Edit Dialog (with all Excel fields) ===
function EditBelanjaDialog({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const { data: vendorsData } = useVendors();
  const vendors = vendorsData?.items ?? [];

  const toDateInput = (d: string | null | undefined): string => {
    if (!d) return "";
    if (d.includes("-")) return d.substring(0, 10);
    return d;
  };

  const [form, setForm] = useState({
    noPesan: tx.noPesan || "",
    noBku: tx.noBku || "",
    kodeProgram: tx.kodeProgram || "",
    kodeRekening: tx.kodeRekening || "",
    tglPerencanaan: toDateInput(tx.tglPerencanaan),
    tglPesan: toDateInput(tx.tglPesan),
    tglBast: toDateInput(tx.tglBast),
    tglPeriksa: toDateInput(tx.tglPeriksa),
    tglBayar: toDateInput(tx.tglBayar),
    uraian: tx.uraian || "",
    namaBarang: tx.namaBarang || "",
    volume: String(tx.volume || 0),
    satuan: tx.satuan || "",
    tarifHarga: String(tx.tarifHarga || 0),
    kategoriBelanja: tx.kategoriBelanja || "",
    spesifikasiBarang: tx.spesifikasiBarang || "",
    hargaToko1: tx.hargaToko1 ? String(tx.hargaToko1) : "",
    hargaToko2: tx.hargaToko2 ? String(tx.hargaToko2) : "",
    namaToko1: tx.namaToko1 || "",
    namaToko2: tx.namaToko2 || "",
    direkturToko1: tx.direkturToko1 || "",
    alamatToko1: tx.alamatToko1 || "",
    alamatToko2: tx.alamatToko2 || "",
    noHp: tx.noHp || "",
    uraianKwitansi: tx.uraianKwitansi || "",
    namaPekerjaanKategori: tx.namaPekerjaanKategori || "",
    satuan2: tx.satuan2 || "",
    hargaSatuanSebelumPajak: tx.hargaSatuanSebelumPajak ? String(tx.hargaSatuanSebelumPajak) : "",
    alamatSuratBalasan: tx.alamatSuratBalasan || "",
    vendorId: tx.vendorId || "__none__",
    bulan: tx.bulan ? String(tx.bulan) : "",
    status: tx.status || "pending",
  });

  const computedJumlah =
    (parseFloat(form.volume) || 0) * (parseFloat(form.tarifHarga) || 0);

  const handleSave = async () => {
    try {
      const numOrNull = (v: string): number | null =>
        v === "" ? null : parseFloat(v) || null;

      await updateMutation.mutateAsync({
        id: tx.id,
        data: {
          noPesan: form.noPesan || null,
          noBku: form.noBku || null,
          kodeProgram: form.kodeProgram || null,
          kodeRekening: form.kodeRekening || null,
          tglPerencanaan: form.tglPerencanaan || null,
          tglPesan: form.tglPesan || null,
          tglBast: form.tglBast || null,
          tglPeriksa: form.tglPeriksa || null,
          tglBayar: form.tglBayar || null,
          uraian: form.uraian,
          namaBarang: form.namaBarang || null,
          volume: parseFloat(form.volume) || 0,
          satuan: form.satuan || null,
          tarifHarga: parseFloat(form.tarifHarga) || 0,
          jumlah: computedJumlah,
          realisasi: computedJumlah,
          kategoriBelanja: form.kategoriBelanja || null,
          spesifikasiBarang: form.spesifikasiBarang || null,
          hargaToko1: numOrNull(form.hargaToko1),
          hargaToko2: numOrNull(form.hargaToko2),
          namaToko1: form.namaToko1 || null,
          namaToko2: form.namaToko2 || null,
          direkturToko1: form.direkturToko1 || null,
          alamatToko1: form.alamatToko1 || null,
          alamatToko2: form.alamatToko2 || null,
          noHp: form.noHp || null,
          uraianKwitansi: form.uraianKwitansi || null,
          namaPekerjaanKategori: form.namaPekerjaanKategori || null,
          satuan2: form.satuan2 || null,
          hargaSatuanSebelumPajak: numOrNull(form.hargaSatuanSebelumPajak),
          alamatSuratBalasan: form.alamatSuratBalasan || null,
          vendorId: form.vendorId && form.vendorId !== "__none__" ? form.vendorId : null,
          bulan: form.bulan ? parseInt(form.bulan) : null,
          status: form.status,
          masukBku: form.status === "lunas" ? "MASUK BKU" : null,
        },
      });
      toast.success("Data belanja berhasil diperbarui");
      onClose();
    } catch (e) {
      toast.error("Gagal menyimpan: " + (e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus barang ini dari pesanan?")) return;
    try {
      await deleteMutation.mutateAsync(tx.id);
      toast.success("Barang berhasil dihapus");
      onClose();
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-violet-600" />
            Edit Barang Belanja
            {tx.status === "draft" && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                Draft - Lengkapi data
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            No. Pesan: {tx.noPesan || "—"} · No. BKU: {tx.noBku || "—"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Section: Belanja */}
          <div>
            <h4 className="text-xs font-bold uppercase text-violet-600 mb-2">
              Belanja
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Uraian Kegiatan *</Label>
                <Textarea
                  value={form.uraian}
                  onChange={(e) => setForm({ ...form, uraian: e.target.value })}
                  placeholder="cth. Pengadaan ATK untuk kegiatan KBM"
                  className="text-sm min-h-[50px]"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Nama Barang</Label>
                <Input
                  value={form.namaBarang}
                  onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
                  placeholder="cth. Kertas HVS A4 80gsm"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Volume</Label>
                <Input
                  type="number"
                  value={form.volume}
                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Satuan</Label>
                <Input
                  value={form.satuan}
                  onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                  placeholder="rim, dus, buah"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Harga Satuan (Rp)</Label>
                <Input
                  type="number"
                  value={form.tarifHarga}
                  onChange={(e) => setForm({ ...form, tarifHarga: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Jumlah (auto)</Label>
                <Input
                  value={formatRupiah(computedJumlah)}
                  readOnly
                  className="h-9 text-sm font-mono bg-muted/50 font-bold text-rose-700 dark:text-rose-300"
                />
              </div>
              <div>
                <Label className="text-xs">Kategori Belanja</Label>
                <Input
                  value={form.kategoriBelanja}
                  onChange={(e) => setForm({ ...form, kategoriBelanja: e.target.value })}
                  placeholder="cth. ATK, Konsumsi"
                  className="h-9 text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Spesifikasi Barang</Label>
                <Input
                  value={form.spesifikasiBarang}
                  onChange={(e) => setForm({ ...form, spesifikasiBarang: e.target.value })}
                  placeholder="cth. Kertas Hvs 80Gsm Paper One A4"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Informasi Pesanan */}
          <div>
            <h4 className="text-xs font-bold uppercase text-violet-600 mb-2">
              Informasi Pesanan
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">No. Surat Pesan</Label>
                <Input
                  value={form.noPesan}
                  onChange={(e) => setForm({ ...form, noPesan: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">No. BKU</Label>
                <Input
                  value={form.noBku}
                  onChange={(e) => setForm({ ...form, noBku: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Kode Program</Label>
                <Input
                  value={form.kodeProgram}
                  onChange={(e) => setForm({ ...form, kodeProgram: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Kode Rekening</Label>
                <Input
                  value={form.kodeRekening}
                  onChange={(e) => setForm({ ...form, kodeRekening: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Tanggal */}
          <div>
            <h4 className="text-xs font-bold uppercase text-violet-600 mb-2">
              Tanggal
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tgl Perencanaan</Label>
                <Input type="date" value={form.tglPerencanaan} onChange={(e) => setForm({ ...form, tglPerencanaan: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tgl Pesanan</Label>
                <Input type="date" value={form.tglPesan} onChange={(e) => setForm({ ...form, tglPesan: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tgl BAST</Label>
                <Input type="date" value={form.tglBast} onChange={(e) => setForm({ ...form, tglBast: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tgl Pemeriksaan</Label>
                <Input type="date" value={form.tglPeriksa} onChange={(e) => setForm({ ...form, tglPeriksa: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tgl Bayar</Label>
                <Input type="date" value={form.tglBayar} onChange={(e) => setForm({ ...form, tglBayar: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Bulan</Label>
                <Select value={form.bulan} onValueChange={(v) => setForm({ ...form, bulan: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Tidak ada —</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Toko/Vendor */}
          <div>
            <h4 className="text-xs font-bold uppercase text-violet-600 mb-2">
              Toko / Vendor
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Vendor (terdaftar)</Label>
                <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Pilih vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Tidak ada —</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Nama Toko 1 (manual)</Label>
                <Input
                  value={form.namaToko1}
                  onChange={(e) => setForm({ ...form, namaToko1: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Direktur Toko 1</Label>
                <Input
                  value={form.direkturToko1}
                  onChange={(e) => setForm({ ...form, direkturToko1: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">No. HP</Label>
                <Input
                  value={form.noHp}
                  onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Alamat Toko 1</Label>
                <Input
                  value={form.alamatToko1}
                  onChange={(e) => setForm({ ...form, alamatToko1: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nama Toko 2</Label>
                <Input
                  value={form.namaToko2}
                  onChange={(e) => setForm({ ...form, namaToko2: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Alamat Toko 2</Label>
                <Input
                  value={form.alamatToko2}
                  onChange={(e) => setForm({ ...form, alamatToko2: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Harga Toko 1 (Rp)</Label>
                <Input
                  type="number"
                  value={form.hargaToko1}
                  onChange={(e) => setForm({ ...form, hargaToko1: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Harga Toko 2 (Rp)</Label>
                <Input
                  type="number"
                  value={form.hargaToko2}
                  onChange={(e) => setForm({ ...form, hargaToko2: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Kwitansi & Lainnya */}
          <div>
            <h4 className="text-xs font-bold uppercase text-violet-600 mb-2">
              Kwitansi & Lainnya
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Uraian Kwitansi</Label>
                <Input
                  value={form.uraianKwitansi}
                  onChange={(e) => setForm({ ...form, uraianKwitansi: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nama Pekerjaan/Kategori</Label>
                <Input
                  value={form.namaPekerjaanKategori}
                  onChange={(e) => setForm({ ...form, namaPekerjaanKategori: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Satuan (kwitansi)</Label>
                <Input
                  value={form.satuan2}
                  onChange={(e) => setForm({ ...form, satuan2: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Harga Satuan Sebelum Pajak (Rp)</Label>
                <Input
                  type="number"
                  value={form.hargaSatuanSebelumPajak}
                  onChange={(e) => setForm({ ...form, hargaSatuanSebelumPajak: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Alamat Surat Balasan Toko</Label>
                <Input
                  value={form.alamatSuratBalasan}
                  onChange={(e) => setForm({ ...form, alamatSuratBalasan: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Status */}
          <div>
            <h4 className="text-xs font-bold uppercase text-violet-600 mb-2">
              Status
            </h4>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (Belum Lengkap)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-rose-600 border-rose-300 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Hapus
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              Simpan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// === Add Dialog ===
function AddBelanjaDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateTransaction();
  const { data: vendorsData } = useVendors();
  const vendors = vendorsData?.items ?? [];

  const [form, setForm] = useState({
    noPesan: "",
    noBku: "",
    tglPesan: "",
    uraian: "",
    namaBarang: "",
    volume: "0",
    satuan: "",
    tarifHarga: "0",
    vendorId: "__none__",
    bulan: String(new Date().getMonth() + 1),
    status: "pending",
  });

  const computedJumlah =
    (parseFloat(form.volume) || 0) * (parseFloat(form.tarifHarga) || 0);

  const handleSave = async () => {
    if (!form.uraian && !form.namaBarang) {
      toast.error("Isi minimal uraian atau nama barang");
      return;
    }
    try {
      await createMutation.mutateAsync({
        noPesan: form.noPesan || null,
        noBku: form.noBku || null,
        tglPesan: form.tglPesan || null,
        uraian: form.uraian,
        namaBarang: form.namaBarang || null,
        volume: parseFloat(form.volume) || 0,
        satuan: form.satuan || null,
        tarifHarga: parseFloat(form.tarifHarga) || 0,
        jumlah: computedJumlah,
        realisasi: computedJumlah,
        vendorId: form.vendorId && form.vendorId !== "__none__" ? form.vendorId : null,
        bulan: form.bulan !== "__none__" ? parseInt(form.bulan) : null,
        tahun: 2025,
        status: form.status,
        masukBku: form.status === "lunas" ? "MASUK BKU" : null,
      } as Partial<Transaction>);
      toast.success("Barang belanja berhasil ditambahkan");
      onClose();
    } catch (e) {
      toast.error("Gagal menambah: " + (e as Error).message);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-600" />
            Tambah Barang Belanja
          </DialogTitle>
          <DialogDescription className="text-xs">
            Tambah barang baru ke dalam pesanan
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <Label className="text-xs">No. Surat Pesan</Label>
            <Input value={form.noPesan} onChange={(e) => setForm({ ...form, noPesan: e.target.value })} className="h-9 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs">No. BKU</Label>
            <Input value={form.noBku} onChange={(e) => setForm({ ...form, noBku: e.target.value })} className="h-9 text-sm font-mono" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Uraian Kegiatan *</Label>
            <Textarea value={form.uraian} onChange={(e) => setForm({ ...form, uraian: e.target.value })} className="text-sm min-h-[50px]" />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Nama Barang</Label>
            <Input value={form.namaBarang} onChange={(e) => setForm({ ...form, namaBarang: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Volume</Label>
            <Input type="number" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} className="h-9 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs">Satuan</Label>
            <Input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Harga Satuan (Rp)</Label>
            <Input type="number" value={form.tarifHarga} onChange={(e) => setForm({ ...form, tarifHarga: e.target.value })} className="h-9 text-sm font-mono" />
          </div>
          <div>
            <Label className="text-xs">Jumlah (auto)</Label>
            <Input value={formatRupiah(computedJumlah)} readOnly className="h-9 text-sm font-mono bg-muted/50 font-bold text-rose-700 dark:text-rose-300" />
          </div>
          <div>
            <Label className="text-xs">Vendor</Label>
            <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Pilih vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Tidak ada —</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bulan</Label>
            <Select value={form.bulan} onValueChange={(v) => setForm({ ...form, bulan: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {getMonthName(i + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tgl Pesan</Label>
            <Input type="date" value={form.tglPesan} onChange={(e) => setForm({ ...form, tglPesan: e.target.value })} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (Belum Lengkap)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            disabled={createMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5 mr-1" />
            )}
            Tambah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-md border px-3 py-2", bg)}>
      <div className={cn("flex items-center gap-1.5 mb-1", color)}>
        {icon}
        <span className="text-[10px] uppercase tracking-wide font-bold">
          {label}
        </span>
      </div>
      <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
    </div>
  );
}
