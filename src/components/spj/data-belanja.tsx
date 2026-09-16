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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
  useVendors,
  useCreateTransaction,
} from "@/hooks/use-spj";
import type { Transaction } from "@/lib/types/spj";
import {
  formatRupiah,
  formatNumber,
  formatDateShort,
  getMonthName,
} from "@/lib/format";

// ============================
// Helpers
// ============================

/** Convert possibly-ISO date string into yyyy-mm-dd for <input type="date">. */
function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  if (d.includes("T")) return d.substring(0, 10);
  if (d.includes("-") && d.length >= 10) return d.substring(0, 10);
  return d;
}

/** Safely parse a string into a number, defaulting to 0. */
function toNum(s: string | number | null | undefined): number {
  if (typeof s === "number") return isNaN(s) ? 0 : s;
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** Format a number with thousand separators, or "—" if 0/null. */
function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || n === 0 || isNaN(n)) return "—";
  return formatNumber(n);
}

/** Format a number as Rupiah, or "—" if 0/null. */
function fmtRupiah(n: number | null | undefined): string {
  if (n === null || n === undefined || n === 0 || isNaN(n)) return "—";
  return formatRupiah(n);
}

/** Format a date as "dd/mm/yyyy", or "—" if empty. */
function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const s = formatDateShort(d);
  return s === "-" ? "—" : s;
}

/** Render a text value, or "—" muted if empty. */
function Cell({
  value,
  className,
  align = "left",
}: {
  value: string | null | undefined;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const alignCls =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";
  if (value === null || value === undefined || value === "") {
    return (
      <span
        className={cn(
          "block max-w-[260px] truncate text-muted-foreground/40",
          alignCls,
          className
        )}
        title={typeof value === "string" ? value : undefined}
      >
        —
      </span>
    );
  }
  return (
    <span
      className={cn("block max-w-[260px] truncate", alignCls, className)}
      title={value}
    >
      {value}
    </span>
  );
}

// ============================
// Main component
// ============================

export function DataBelanja() {
  const [search, setSearch] = useState("");
  const [bulanFilter, setBulanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const bulan = bulanFilter === "all" ? undefined : parseInt(bulanFilter);
  const status = statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading, error } = useTransactions({
    q: search || undefined,
    bulan,
    status,
    limit: 500,
  });

  const transactions = data?.transactions ?? [];

  const stats = useMemo(() => {
    const total = transactions.length;
    const draft = transactions.filter((t) => t.status === "draft").length;
    const pending = transactions.filter((t) => t.status === "pending").length;
    const lunas = transactions.filter((t) => t.status === "lunas").length;
    const totalNilai = transactions.reduce((s, t) => s + (t.jumlah || 0), 0);
    return { total, draft, pending, lunas, totalNilai };
  }, [transactions]);

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
                Tabel lengkap 34 kolom Excel. Klik sel{" "}
                <span className="font-semibold text-blue-600">
                  Uraian Kegiatan
                </span>{" "}
                untuk membuka dialog edit.
              </CardDescription>
            </div>
            <Button onClick={() => setShowAdd(true)} size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Tambah Belanja
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Total"
          value={stats.total}
          color="text-violet-700 dark:text-violet-300"
          bg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          icon={<FileEdit className="h-4 w-4" />}
          label="Draft"
          value={stats.draft}
          color="text-amber-700 dark:text-amber-300"
          bg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending"
          value={stats.pending}
          color="text-cyan-700 dark:text-cyan-300"
          bg="bg-cyan-50 dark:bg-cyan-950/40"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Lunas"
          value={stats.lunas}
          color="text-emerald-700 dark:text-emerald-300"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari uraian, nama barang, no. BKU..."
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
                <SelectItem value="draft">
                  <span className="flex items-center gap-1.5">
                    <FileEdit className="h-3 w-3 text-amber-600" />
                    Draft
                  </span>
                </SelectItem>
                <SelectItem value="pending">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-cyan-600" />
                    Pending
                  </span>
                </SelectItem>
                <SelectItem value="lunas">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    Lunas
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
              Gagal memuat data: {error.message}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium">Belum ada data belanja</p>
              <p className="text-xs text-muted-foreground mt-1">
                Import Excel atau tambah manual untuk mulai
              </p>
            </div>
          ) : (
            <BelanjaTable
              transactions={transactions}
              onEdit={(tx) => setEditingTx(tx)}
            />
          )}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Menampilkan {transactions.length} data belanja · Total Nilai:{" "}
          <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
            {formatRupiah(stats.totalNilai)}
          </span>
        </div>
      )}

      {/* Edit Dialog */}
      {editingTx && (
        <EditBelanjaDialog
          tx={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Add Dialog */}
      {showAdd && <AddBelanjaDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ============================
// Wide table with 37 columns
// ============================

function BelanjaTable({
  transactions,
  onEdit,
}: {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
}) {
  return (
    <div className="max-h-[680px] overflow-auto border-t">
      <table className="w-full text-[11px] border-separate border-spacing-0">
        <thead className="sticky top-0 z-30">
          <tr className="bg-card">
            {/* No - sticky left */}
            <ThStickyLeft className="left-0 z-40 w-10 text-center">
              No
            </ThStickyLeft>
            {/* Excel cols 1-9 */}
            <Th className="text-left">No. Surat Pesan</Th>
            <Th className="text-left">No BKU</Th>
            <Th className="text-left">Kode Program</Th>
            <Th className="text-left">Kode Rekening</Th>
            <Th className="text-left">Tgl Perencanaan</Th>
            <Th className="text-left">Tgl Pesanan</Th>
            <Th className="text-left">Tgl BAST</Th>
            <Th className="text-left">Tgl Pemeriksaan</Th>
            <Th className="text-left">Tgl Bayar</Th>
            {/* Uraian Kegiatan - sticky left at left-10 (40px) */}
            <ThStickyLeft className="left-10 z-40 min-w-[220px] text-left border-r">
              Uraian Kegiatan
            </ThStickyLeft>
            {/* Excel cols 11-34 */}
            <Th className="text-left">Nama Barang</Th>
            <Th className="text-right">Volume</Th>
            <Th className="text-left">Satuan</Th>
            <Th className="text-right">Harga Satuan</Th>
            <Th className="text-right">Jumlah</Th>
            <Th className="text-left">Kategori Belanja</Th>
            <Th className="text-left">Spesifikasi Barang</Th>
            <Th className="text-right">Harga Toko 1</Th>
            <Th className="text-right">Harga Toko 2</Th>
            <Th className="text-left">Nama Toko 1</Th>
            <Th className="text-left">Nama Toko 2</Th>
            <Th className="text-left">Direktur Toko 1</Th>
            <Th className="text-left">Alamat Toko 1</Th>
            <Th className="text-left">Alamat Toko 2</Th>
            <Th className="text-left">Uraian Kwitansi</Th>
            <Th className="text-left">Nama Pekerjaan/Kategori</Th>
            <Th className="text-left">Satuan</Th>
            <Th className="text-right">Harga Satuan Sebelum Pajak</Th>
            <Th className="text-right">Jumlah Harga Sebelum Pajak</Th>
            <Th className="text-right">Harga Total Asli</Th>
            <Th className="text-right">Total Harga Sebelum DPP</Th>
            <Th className="text-right">Total Harga Asli</Th>
            <Th className="text-left">Alamat Surat Balasan</Th>
            <Th className="text-left">NO HP</Th>
            {/* Status */}
            <Th className="text-center">Status</Th>
            {/* Edit button */}
            <Th className="text-center w-12">Aksi</Th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <BelanjaRow
              key={tx.id}
              tx={tx}
              index={i + 1}
              onEdit={() => onEdit(tx)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Sticky header cell (for left-anchored columns). */
function ThStickyLeft({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "bg-card text-foreground h-9 px-2 align-middle font-semibold whitespace-nowrap border-b border-border text-[11px]",
        "sticky",
        className
      )}
    >
      {children}
    </th>
  );
}

/** Normal header cell. */
function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "bg-card text-foreground h-9 px-2 align-middle font-semibold whitespace-nowrap border-b border-border text-[11px]",
        className
      )}
    >
      {children}
    </th>
  );
}

function BelanjaRow({
  tx,
  index,
  onEdit,
}: {
  tx: Transaction;
  index: number;
  onEdit: () => void;
}) {
  const isDraft = tx.status === "draft";
  const isLunas = tx.status === "lunas";

  const rowBg = isDraft ? "bg-amber-50/40 dark:bg-amber-950/10" : "";
  const stickyBg = isDraft
    ? "bg-amber-50/95 dark:bg-amber-950/40"
    : "bg-card hover:bg-muted/40";

  return (
    <tr className={cn("hover:bg-muted/40 transition-colors", rowBg)}>
      {/* No - sticky left */}
      <td
        className={cn(
          "sticky left-0 z-20 px-2 py-1.5 text-center font-mono text-muted-foreground border-r border-border",
          stickyBg
        )}
      >
        {index}
      </td>

      {/* 1. No. Surat Pesan */}
      <td className="px-2 py-1.5 font-mono">
        <Cell value={tx.noPesan} />
      </td>
      {/* 2. No BKU */}
      <td className="px-2 py-1.5 font-mono">
        <Cell value={tx.noBku} />
      </td>
      {/* 3. Kode Program */}
      <td className="px-2 py-1.5 font-mono">
        <Cell value={tx.kodeProgram} />
      </td>
      {/* 4. Kode Rekening */}
      <td className="px-2 py-1.5 font-mono">
        <Cell value={tx.kodeRekening} />
      </td>
      {/* 5. Tgl Perencanaan */}
      <td className="px-2 py-1.5">
        <Cell value={fmtDate(tx.tglPerencanaan)} />
      </td>
      {/* 6. Tgl Pesanan */}
      <td className="px-2 py-1.5">
        <Cell value={fmtDate(tx.tglPesan)} />
      </td>
      {/* 7. Tgl BAST */}
      <td className="px-2 py-1.5">
        <Cell value={fmtDate(tx.tglBast)} />
      </td>
      {/* 8. Tgl Pemeriksaan */}
      <td className="px-2 py-1.5">
        <Cell value={fmtDate(tx.tglPeriksa)} />
      </td>
      {/* 9. Tgl Bayar */}
      <td className="px-2 py-1.5">
        <Cell value={fmtDate(tx.tglBayar)} />
      </td>

      {/* 10. Uraian Kegiatan - CLICKABLE - sticky left at left-10 */}
      <td
        onClick={onEdit}
        className={cn(
          "sticky left-10 z-20 px-2 py-1.5 min-w-[220px] border-r border-border cursor-pointer",
          stickyBg
        )}
        title="Klik untuk edit data ini"
      >
        <span className="block max-w-[260px] truncate font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
          {tx.uraian || (
            <span className="text-muted-foreground/50 italic font-normal">
              (belum diisi) - klik untuk edit
            </span>
          )}
        </span>
      </td>

      {/* 11. Nama Barang - SEPARATE COLUMN */}
      <td className="px-2 py-1.5">
        <Cell value={tx.namaBarang} />
      </td>
      {/* 12. Volume */}
      <td className="px-2 py-1.5 text-right font-mono">
        {tx.volume > 0 ? (
          formatNumber(tx.volume)
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      {/* 13. Satuan */}
      <td className="px-2 py-1.5">
        <Cell value={tx.satuan} />
      </td>
      {/* 14. Harga Satuan */}
      <td className="px-2 py-1.5 text-right font-mono">
        {tx.tarifHarga > 0 ? (
          formatRupiah(tx.tarifHarga)
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      {/* 15. Jumlah */}
      <td className="px-2 py-1.5 text-right font-mono font-semibold">
        {tx.jumlah > 0 ? (
          <span className="text-rose-700 dark:text-rose-300">
            {formatRupiah(tx.jumlah)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </td>
      {/* 16. Kategori Belanja */}
      <td className="px-2 py-1.5">
        <Cell value={tx.kategoriBelanja} />
      </td>
      {/* 17. Spesifikasi Barang */}
      <td className="px-2 py-1.5">
        <Cell value={tx.spesifikasiBarang} />
      </td>
      {/* 18. Harga Toko 1 */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.hargaToko1)}
      </td>
      {/* 19. Harga Toko 2 */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.hargaToko2)}
      </td>
      {/* 20. Nama Toko 1 */}
      <td className="px-2 py-1.5">
        <Cell value={tx.namaToko1} />
      </td>
      {/* 21. Nama Toko 2 */}
      <td className="px-2 py-1.5">
        <Cell value={tx.namaToko2} />
      </td>
      {/* 22. Direktur Toko 1 */}
      <td className="px-2 py-1.5">
        <Cell value={tx.direkturToko1} />
      </td>
      {/* 23. Alamat Toko 1 */}
      <td className="px-2 py-1.5">
        <Cell value={tx.alamatToko1} />
      </td>
      {/* 24. Alamat Toko 2 */}
      <td className="px-2 py-1.5">
        <Cell value={tx.alamatToko2} />
      </td>
      {/* 25. Uraian Kwitansi */}
      <td className="px-2 py-1.5">
        <Cell value={tx.uraianKwitansi} />
      </td>
      {/* 26. Nama Pekerjaan/Kategori */}
      <td className="px-2 py-1.5">
        <Cell value={tx.namaPekerjaanKategori} />
      </td>
      {/* 27. Satuan (satuan2) */}
      <td className="px-2 py-1.5">
        <Cell value={tx.satuan2} />
      </td>
      {/* 28. Harga Satuan Sebelum Pajak */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.hargaSatuanSebelumPajak)}
      </td>
      {/* 29. Jumlah Harga Sebelum Pajak */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.jumlahHargaSebelumPajak)}
      </td>
      {/* 30. Harga Total Asli */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.hargaTotalAsli)}
      </td>
      {/* 31. Total Harga Sebelum DPP */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.totalHargaSebelumDPP)}
      </td>
      {/* 32. Total Harga Asli */}
      <td className="px-2 py-1.5 text-right font-mono">
        {fmtRupiah(tx.totalHargaAsli)}
      </td>
      {/* 33. Alamat Surat Balasan */}
      <td className="px-2 py-1.5">
        <Cell value={tx.alamatSuratBalasan} />
      </td>
      {/* 34. NO HP */}
      <td className="px-2 py-1.5 font-mono">
        <Cell value={tx.noHp} />
      </td>

      {/* Status */}
      <td className="px-2 py-1.5 text-center">
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

      {/* Edit button (small, far right) */}
      <td className="px-2 py-1.5 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-6 w-6 p-0"
          title="Edit data"
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
}

// ============================
// Edit dialog with all 34 fields
// ============================

interface EditFormState {
  // Informasi Pesanan
  noPesan: string;
  noBku: string;
  kodeProgram: string;
  kodeRekening: string;
  // Tanggal
  tglPerencanaan: string;
  tglPesan: string;
  tglBast: string;
  tglPeriksa: string;
  tglBayar: string;
  // Belanja
  uraian: string;
  namaBarang: string;
  volume: string;
  satuan: string;
  tarifHarga: string;
  jumlah: string;
  kategoriBelanja: string;
  spesifikasiBarang: string;
  // Toko 1
  namaToko1: string;
  direkturToko1: string;
  alamatToko1: string;
  noHp: string;
  hargaToko1: string;
  // Toko 2
  namaToko2: string;
  alamatToko2: string;
  hargaToko2: string;
  // Kwitansi & Lainnya
  uraianKwitansi: string;
  namaPekerjaanKategori: string;
  satuan2: string;
  hargaSatuanSebelumPajak: string;
  jumlahHargaSebelumPajak: string;
  hargaTotalAsli: string;
  totalHargaSebelumDPP: string;
  totalHargaAsli: string;
  alamatSuratBalasan: string;
  // Status & vendor
  vendorId: string;
  bulan: string;
  status: string;
}

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

  const [form, setForm] = useState<EditFormState>({
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
    volume: String(tx.volume ?? 0),
    satuan: tx.satuan || "",
    tarifHarga: String(tx.tarifHarga ?? 0),
    jumlah: String(tx.jumlah ?? 0),
    kategoriBelanja: tx.kategoriBelanja || "",
    spesifikasiBarang: tx.spesifikasiBarang || "",
    namaToko1: tx.namaToko1 || "",
    direkturToko1: tx.direkturToko1 || "",
    alamatToko1: tx.alamatToko1 || "",
    noHp: tx.noHp || "",
    hargaToko1: tx.hargaToko1 != null ? String(tx.hargaToko1) : "",
    namaToko2: tx.namaToko2 || "",
    alamatToko2: tx.alamatToko2 || "",
    hargaToko2: tx.hargaToko2 != null ? String(tx.hargaToko2) : "",
    uraianKwitansi: tx.uraianKwitansi || "",
    namaPekerjaanKategori: tx.namaPekerjaanKategori || "",
    satuan2: tx.satuan2 || "",
    hargaSatuanSebelumPajak:
      tx.hargaSatuanSebelumPajak != null
        ? String(tx.hargaSatuanSebelumPajak)
        : "",
    jumlahHargaSebelumPajak:
      tx.jumlahHargaSebelumPajak != null
        ? String(tx.jumlahHargaSebelumPajak)
        : "",
    hargaTotalAsli:
      tx.hargaTotalAsli != null ? String(tx.hargaTotalAsli) : "",
    totalHargaSebelumDPP:
      tx.totalHargaSebelumDPP != null ? String(tx.totalHargaSebelumDPP) : "",
    totalHargaAsli:
      tx.totalHargaAsli != null ? String(tx.totalHargaAsli) : "",
    alamatSuratBalasan: tx.alamatSuratBalasan || "",
    vendorId: tx.vendorId || "__none__",
    bulan: tx.bulan ? String(tx.bulan) : "__none__",
    status: tx.status || "pending",
  });

  // Auto-compute jumlah from volume * tarifHarga
  const computedJumlah =
    (parseFloat(form.volume) || 0) * (parseFloat(form.tarifHarga) || 0);

  const update = <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: tx.id,
        data: {
          // Informasi Pesanan
          noPesan: form.noPesan || null,
          noBku: form.noBku || null,
          kodeProgram: form.kodeProgram || null,
          kodeRekening: form.kodeRekening || null,
          // Tanggal
          tglPerencanaan: form.tglPerencanaan || null,
          tglPesan: form.tglPesan || null,
          tglBast: form.tglBast || null,
          tglPeriksa: form.tglPeriksa || null,
          tglBayar: form.tglBayar || null,
          // Belanja
          uraian: form.uraian,
          namaBarang: form.namaBarang || null,
          volume: toNum(form.volume),
          satuan: form.satuan || null,
          tarifHarga: toNum(form.tarifHarga),
          jumlah: computedJumlah,
          realisasi: computedJumlah,
          kategoriBelanja: form.kategoriBelanja || null,
          spesifikasiBarang: form.spesifikasiBarang || null,
          // Toko 1
          namaToko1: form.namaToko1 || null,
          direkturToko1: form.direkturToko1 || null,
          alamatToko1: form.alamatToko1 || null,
          noHp: form.noHp || null,
          hargaToko1: form.hargaToko1 ? toNum(form.hargaToko1) : null,
          // Toko 2
          namaToko2: form.namaToko2 || null,
          alamatToko2: form.alamatToko2 || null,
          hargaToko2: form.hargaToko2 ? toNum(form.hargaToko2) : null,
          // Kwitansi & Lainnya
          uraianKwitansi: form.uraianKwitansi || null,
          namaPekerjaanKategori: form.namaPekerjaanKategori || null,
          satuan2: form.satuan2 || null,
          hargaSatuanSebelumPajak: form.hargaSatuanSebelumPajak
            ? toNum(form.hargaSatuanSebelumPajak)
            : null,
          jumlahHargaSebelumPajak: form.jumlahHargaSebelumPajak
            ? toNum(form.jumlahHargaSebelumPajak)
            : null,
          hargaTotalAsli: form.hargaTotalAsli
            ? toNum(form.hargaTotalAsli)
            : null,
          totalHargaSebelumDPP: form.totalHargaSebelumDPP
            ? toNum(form.totalHargaSebelumDPP)
            : null,
          totalHargaAsli: form.totalHargaAsli
            ? toNum(form.totalHargaAsli)
            : null,
          alamatSuratBalasan: form.alamatSuratBalasan || null,
          // Status & misc
          vendorId:
            form.vendorId && form.vendorId !== "__none__"
              ? form.vendorId
              : null,
          bulan:
            form.bulan && form.bulan !== "__none__"
              ? parseInt(form.bulan)
              : null,
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
    if (!confirm("Hapus data belanja ini?")) return;
    try {
      await deleteMutation.mutateAsync(tx.id);
      toast.success("Data berhasil dihapus");
      onClose();
    } catch (e) {
      toast.error("Gagal menghapus: " + (e as Error).message);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Pencil className="h-4 w-4 text-violet-600" />
            Edit Data Belanja
            {tx.status === "draft" && (
              <Badge
                variant="outline"
                className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300"
              >
                Draft - Lengkapi data
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              ID: {tx.id.substring(0, 8)}…
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Section: Informasi Pesanan */}
          <Section title="Informasi Pesanan">
            <Field label="No. Surat Pesan">
              <Input
                value={form.noPesan}
                onChange={(e) => update("noPesan", e.target.value)}
                placeholder="01"
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="No BKU">
              <Input
                value={form.noBku}
                onChange={(e) => update("noBku", e.target.value)}
                placeholder="BPU01"
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Kode Program">
              <Input
                value={form.kodeProgram}
                onChange={(e) => update("kodeProgram", e.target.value)}
                placeholder="cth. 2.03.01"
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Kode Rekening">
              <Input
                value={form.kodeRekening}
                onChange={(e) => update("kodeRekening", e.target.value)}
                placeholder="cth. 5.1.02.01.01.0052"
                className="h-9 text-sm font-mono"
              />
            </Field>
          </Section>

          {/* Section: Tanggal */}
          <Section title="Tanggal">
            <Field label="Tgl Perencanaan">
              <Input
                type="date"
                value={form.tglPerencanaan}
                onChange={(e) => update("tglPerencanaan", e.target.value)}
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Tgl Pesanan">
              <Input
                type="date"
                value={form.tglPesan}
                onChange={(e) => update("tglPesan", e.target.value)}
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Tgl BAST">
              <Input
                type="date"
                value={form.tglBast}
                onChange={(e) => update("tglBast", e.target.value)}
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Tgl Pemeriksaan">
              <Input
                type="date"
                value={form.tglPeriksa}
                onChange={(e) => update("tglPeriksa", e.target.value)}
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Tgl Bayar">
              <Input
                type="date"
                value={form.tglBayar}
                onChange={(e) => update("tglBayar", e.target.value)}
                className="h-9 text-sm"
              />
            </Field>
          </Section>

          {/* Section: Belanja */}
          <Section title="Belanja">
            <Field label="Uraian Kegiatan *" full>
              <Textarea
                value={form.uraian}
                onChange={(e) => update("uraian", e.target.value)}
                placeholder="cth. Pengadaan ATK untuk kegiatan KBM"
                className="text-sm min-h-[60px]"
              />
            </Field>
            <Field label="Nama Barang" full>
              <Input
                value={form.namaBarang}
                onChange={(e) => update("namaBarang", e.target.value)}
                placeholder="cth. Kertas HVS A4 80gsm"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Volume">
              <Input
                type="number"
                value={form.volume}
                onChange={(e) => update("volume", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Satuan">
              <Input
                value={form.satuan}
                onChange={(e) => update("satuan", e.target.value)}
                placeholder="rim, dus, buah"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Harga Satuan (Rp)">
              <Input
                type="number"
                value={form.tarifHarga}
                onChange={(e) => update("tarifHarga", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Jumlah (auto)">
              <Input
                value={formatRupiah(computedJumlah)}
                readOnly
                className="h-9 text-sm font-mono bg-muted/50 font-bold text-rose-700 dark:text-rose-300"
              />
            </Field>
            <Field label="Kategori Belanja">
              <Input
                value={form.kategoriBelanja}
                onChange={(e) => update("kategoriBelanja", e.target.value)}
                placeholder="cth. ATK, Buku, Fotokopi"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Spesifikasi Barang" full>
              <Textarea
                value={form.spesifikasiBarang}
                onChange={(e) => update("spesifikasiBarang", e.target.value)}
                placeholder="cth. A4 80gsm putih, 500 lembar/rim"
                className="text-sm min-h-[50px]"
              />
            </Field>
          </Section>

          {/* Section: Toko 1 */}
          <Section title="Toko 1">
            <Field label="Nama Toko 1">
              <Input
                value={form.namaToko1}
                onChange={(e) => update("namaToko1", e.target.value)}
                placeholder="cth. UD. JOSUA"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Direktur Toko 1">
              <Input
                value={form.direkturToko1}
                onChange={(e) => update("direkturToko1", e.target.value)}
                placeholder="cth. Gestiwan Bazikho"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Alamat Toko 1" full>
              <Textarea
                value={form.alamatToko1}
                onChange={(e) => update("alamatToko1", e.target.value)}
                placeholder="Alamat lengkap toko"
                className="text-sm min-h-[50px]"
              />
            </Field>
            <Field label="NO HP">
              <Input
                value={form.noHp}
                onChange={(e) => update("noHp", e.target.value)}
                placeholder="08xx-xxxx-xxxx"
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Harga Toko 1 (Rp)">
              <Input
                type="number"
                value={form.hargaToko1}
                onChange={(e) => update("hargaToko1", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </Field>
          </Section>

          {/* Section: Toko 2 */}
          <Section title="Toko 2">
            <Field label="Nama Toko 2">
              <Input
                value={form.namaToko2}
                onChange={(e) => update("namaToko2", e.target.value)}
                placeholder="cth. Toko Maju Jaya"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Harga Toko 2 (Rp)">
              <Input
                type="number"
                value={form.hargaToko2}
                onChange={(e) => update("hargaToko2", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Alamat Toko 2" full>
              <Textarea
                value={form.alamatToko2}
                onChange={(e) => update("alamatToko2", e.target.value)}
                placeholder="Alamat lengkap toko 2"
                className="text-sm min-h-[50px]"
              />
            </Field>
          </Section>

          {/* Section: Kwitansi & Lainnya */}
          <Section title="Kwitansi & Lainnya">
            <Field label="Uraian Kwitansi" full>
              <Textarea
                value={form.uraianKwitansi}
                onChange={(e) => update("uraianKwitansi", e.target.value)}
                placeholder="Uraian yang muncul di kwitansi"
                className="text-sm min-h-[50px]"
              />
            </Field>
            <Field label="Nama Pekerjaan/Kategori">
              <Input
                value={form.namaPekerjaanKategori}
                onChange={(e) =>
                  update("namaPekerjaanKategori", e.target.value)
                }
                placeholder="cth. Pekerjaan Pengadaan"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Satuan (kwitansi)">
              <Input
                value={form.satuan2}
                onChange={(e) => update("satuan2", e.target.value)}
                placeholder="satuan di kwitansi"
                className="h-9 text-sm"
              />
            </Field>
            <Field label="Harga Satuan Sebelum Pajak (Rp)">
              <Input
                type="number"
                value={form.hargaSatuanSebelumPajak}
                onChange={(e) =>
                  update("hargaSatuanSebelumPajak", e.target.value)
                }
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Jumlah Harga Sebelum Pajak (Rp)">
              <Input
                type="number"
                value={form.jumlahHargaSebelumPajak}
                onChange={(e) =>
                  update("jumlahHargaSebelumPajak", e.target.value)
                }
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Harga Total Asli (Rp)">
              <Input
                type="number"
                value={form.hargaTotalAsli}
                onChange={(e) => update("hargaTotalAsli", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Total Harga Sebelum DPP (Rp)">
              <Input
                type="number"
                value={form.totalHargaSebelumDPP}
                onChange={(e) =>
                  update("totalHargaSebelumDPP", e.target.value)
                }
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Total Harga Asli (Rp)">
              <Input
                type="number"
                value={form.totalHargaAsli}
                onChange={(e) => update("totalHargaAsli", e.target.value)}
                className="h-9 text-sm font-mono"
              />
            </Field>
            <Field label="Alamat Surat Balasan Toko" full>
              <Textarea
                value={form.alamatSuratBalasan}
                onChange={(e) =>
                  update("alamatSuratBalasan", e.target.value)
                }
                placeholder="Alamat untuk surat balasan"
                className="text-sm min-h-[50px]"
              />
            </Field>
          </Section>

          {/* Section: Status & Vendor */}
          <Section title="Status & Vendor">
            <Field label="Vendor">
              <Select
                value={form.vendorId}
                onValueChange={(v) => update("vendorId", v)}
              >
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
            </Field>
            <Field label="Bulan">
              <Select
                value={form.bulan}
                onValueChange={(v) => update("bulan", v)}
              >
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
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Belum Lengkap)</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Section>
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

// ============================
// Add dialog (simple, basic fields)
// ============================

function AddBelanjaDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateTransaction();
  const { data: vendorsData } = useVendors();
  const vendors = vendorsData?.items ?? [];

  const [form, setForm] = useState({
    noBku: "",
    noPesan: "",
    kodeProgram: "",
    kodeRekening: "",
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
        noBku: form.noBku || null,
        noPesan: form.noPesan || null,
        kodeProgram: form.kodeProgram || null,
        kodeRekening: form.kodeRekening || null,
        tglPesan: form.tglPesan || null,
        uraian: form.uraian,
        namaBarang: form.namaBarang || null,
        volume: parseFloat(form.volume) || 0,
        satuan: form.satuan || null,
        tarifHarga: parseFloat(form.tarifHarga) || 0,
        jumlah: computedJumlah,
        realisasi: computedJumlah,
        vendorId:
          form.vendorId && form.vendorId !== "__none__"
            ? form.vendorId
            : null,
        bulan: parseInt(form.bulan),
        tahun: 2025,
        status: form.status,
        masukBku: form.status === "lunas" ? "MASUK BKU" : null,
      } as Partial<Transaction>);
      toast.success("Data belanja berhasil ditambahkan");
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
            Tambah Data Belanja
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div>
            <Label className="text-xs">No. BKU</Label>
            <Input
              value={form.noBku}
              onChange={(e) => setForm({ ...form, noBku: e.target.value })}
              placeholder="BPU01"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">No. Pesan</Label>
            <Input
              value={form.noPesan}
              onChange={(e) => setForm({ ...form, noPesan: e.target.value })}
              placeholder="01"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Kode Program</Label>
            <Input
              value={form.kodeProgram}
              onChange={(e) =>
                setForm({ ...form, kodeProgram: e.target.value })
              }
              placeholder="2.03.01"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Kode Rekening</Label>
            <Input
              value={form.kodeRekening}
              onChange={(e) =>
                setForm({ ...form, kodeRekening: e.target.value })
              }
              placeholder="5.1.02.01.01.0052"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Uraian Kegiatan *</Label>
            <Textarea
              value={form.uraian}
              onChange={(e) => setForm({ ...form, uraian: e.target.value })}
              placeholder="cth. Pengadaan ATK untuk kegiatan KBM"
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Nama Barang</Label>
            <Input
              value={form.namaBarang}
              onChange={(e) =>
                setForm({ ...form, namaBarang: e.target.value })
              }
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
              onChange={(e) =>
                setForm({ ...form, tarifHarga: e.target.value })
              }
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
            <Label className="text-xs">Vendor</Label>
            <Select
              value={form.vendorId}
              onValueChange={(v) => setForm({ ...form, vendorId: v })}
            >
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
            <Select
              value={form.bulan}
              onValueChange={(v) => setForm({ ...form, bulan: v })}
            >
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
            <Input
              type="date"
              value={form.tglPesan}
              onChange={(e) => setForm({ ...form, tglPesan: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
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

// ============================
// Sub-components
// ============================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300 border-b border-violet-200 dark:border-violet-900 pb-1">
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1", full && "col-span-2 md:col-span-3")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
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
