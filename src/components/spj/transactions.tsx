"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Search,
  Store,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
  useVendors,
} from "@/hooks/use-spj";
import type { Transaction } from "@/lib/types/spj";
import {
  formatDateShort,
  formatNumber,
  formatRupiah,
  getMonthName,
} from "@/lib/format";

// ============ Form state ============
interface FormState {
  noBku: string;
  uraian: string;
  namaBarang: string;
  vendorId: string;
  vendorNewName: string;
  volume: string;
  satuan: string;
  tarifHarga: string;
  tglPesan: string;
  tglBast: string;
  tglBayar: string;
  bulan: string;
  status: "lunas" | "pending";
  noPesan: string;
  noBast: string;
}

const emptyForm: FormState = {
  noBku: "",
  uraian: "",
  namaBarang: "",
  vendorId: "__none__",
  vendorNewName: "",
  volume: "1",
  satuan: "unit",
  tarifHarga: "0",
  tglPesan: "",
  tglBast: "",
  tglBayar: "",
  bulan: String(new Date().getMonth() + 1),
  status: "pending",
  noPesan: "",
  noBast: "",
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function Transactions() {
  // ============ Filter state ============
  const [q, setQ] = useState("");
  const [bulan, setBulan] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [vendorId, setVendorId] = useState<string>("all");

  // Debounced-ish search via state (search on type, but use latest)
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============ Query ============
  const query = useMemo(
    () => ({
      q: q || undefined,
      bulan: bulan !== "all" ? Number(bulan) : undefined,
      status: status !== "all" ? status : undefined,
      vendorId: vendorId !== "all" ? vendorId : undefined,
      limit: 100,
    }),
    [q, bulan, status, vendorId]
  );

  const { data, isLoading, isError, error, refetch } = useTransactions(query);
  const { data: vendorsData } = useVendors();

  const transactions = data?.transactions ?? [];
  const totalRows = data?.total ?? 0;
  const totalAmount = data?.totalAmount ?? 0;
  const totalRealisasi = transactions.reduce(
    (sum, t) => sum + (t.realisasi || 0),
    0
  );
  const shown = transactions.length;

  // ============ Dialog state ============
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  // ============ Delete dialog state ============
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ============ Mutations ============
  const createMut = useCreateTransaction();
  const updateMut = useUpdateTransaction();
  const deleteMut = useDeleteTransaction();

  // ============ Computed jumlah ============
  const computedJumlah = useMemo(() => {
    const v = parseFloat(form.volume) || 0;
    const t = parseFloat(form.tarifHarga) || 0;
    return v * t;
  }, [form.volume, form.tarifHarga]);

  // ============ Form helpers ============
  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      bulan: bulan !== "all" ? bulan : String(new Date().getMonth() + 1),
    });
    setDialogOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditingId(tx.id);
    setForm({
      noBku: tx.noBku ?? "",
      uraian: tx.uraian ?? "",
      namaBarang: tx.namaBarang ?? "",
      vendorId: tx.vendorId ?? "__none__",
      vendorNewName: "",
      volume: String(tx.volume ?? 0),
      satuan: tx.satuan ?? "",
      tarifHarga: String(tx.tarifHarga ?? 0),
      tglPesan: toInputDate(tx.tglPesan),
      tglBast: toInputDate(tx.tglBast),
      tglBayar: toInputDate(tx.tglBayar),
      bulan: tx.bulan ? String(tx.bulan) : String(new Date().getMonth() + 1),
      status: (tx.status === "lunas" ? "lunas" : "pending"),
      noPesan: tx.noPesan ?? "",
      noBast: tx.noBast ?? "",
    });
    setDialogOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.uraian.trim()) {
      toast.error("Uraian wajib diisi");
      return;
    }
    // Build payload. Note: API derives status from masukBku field; we set
    // masukBku = "MASUK BKU" when status is "lunas" so the GET filter works.
    const payload: Record<string, unknown> = {
      noBku: form.noBku.trim() || null,
      uraian: form.uraian.trim(),
      namaBarang: form.namaBarang.trim() || null,
      volume: parseFloat(form.volume) || 0,
      satuan: form.satuan.trim() || null,
      tarifHarga: parseFloat(form.tarifHarga) || 0,
      jumlah: computedJumlah,
      realisasi: computedJumlah,
      tglPesan: form.tglPesan || null,
      tglBast: form.tglBast || null,
      tglBayar: form.tglBayar || null,
      noPesan: form.noPesan.trim() || null,
      noBast: form.noBast.trim() || null,
      bulan: Number(form.bulan),
      tahun: new Date().getFullYear(),
      status: form.status,
      masukBku: form.status === "lunas" ? "MASUK BKU" : null,
      vendorId: form.vendorId === "__none__" ? null : form.vendorId,
    };

    if (editingId) {
      updateMut.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast.success("Transaksi diperbarui");
            setDialogOpen(false);
          },
          onError: (e: Error) => toast.error("Gagal memperbarui: " + e.message),
        }
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Transaksi ditambahkan");
          setDialogOpen(false);
        },
        onError: (e: Error) => toast.error("Gagal menambah: " + e.message),
      });
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Transaksi dihapus");
        setDeleteOpen(false);
        setDeleteTarget(null);
      },
      onError: (e: Error) => toast.error("Gagal menghapus: " + e.message),
    });
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  // ============ Render ============
  return (
    <div className="space-y-6">
      {/* === Filter bar === */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur sticky top-0 z-30 rounded-xl shadow-sm">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <Label className="text-xs text-slate-500 mb-1 block">
                Cari transaksi
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Uraian, nama barang, no. BKU, no. pesan..."
                  className="pl-8"
                />
              </div>
            </div>

            {/* Bulan */}
            <div className="w-full sm:w-36">
              <Label className="text-xs text-slate-500 mb-1 block">Bulan</Label>
              <Select value={bulan} onValueChange={setBulan}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {getMonthName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="w-full sm:w-36">
              <Label className="text-xs text-slate-500 mb-1 block">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vendor */}
            <div className="w-full sm:w-44">
              <Label className="text-xs text-slate-500 mb-1 block">Vendor</Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Vendor</SelectItem>
                  {(vendorsData?.items ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add button */}
            <Button
              onClick={openCreate}
              className="bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto"
            >
              <Plus className="size-4" />
              Tambah Transaksi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === Summary bar === */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryTile
          icon={<ClipboardList className="size-4" />}
          label="Total Transaksi"
          value={formatNumber(totalRows)}
          tone="violet"
        />
        <SummaryTile
          icon={<Wallet className="size-4" />}
          label="Total Nilai"
          value={formatRupiah(totalAmount)}
          tone="rose"
        />
        <SummaryTile
          icon={<CheckCircle2 className="size-4" />}
          label="Total Realisasi"
          value={formatRupiah(totalRealisasi)}
          tone="emerald"
        />
      </div>

      {/* === Loading / Error === */}
      {isLoading ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="size-6 animate-spin text-rose-500" />
            <p className="text-sm">Memuat transaksi...</p>
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="border-rose-200 dark:border-rose-900">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-rose-700 dark:text-rose-300">
            <AlertCircle className="size-6" />
            <p className="text-sm">Gagal memuat transaksi</p>
            <p className="text-xs text-slate-500">
              {(error as Error)?.message ?? "Unknown error"}
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : shown === 0 ? (
        <Card className="border-dashed border-slate-300 dark:border-slate-700">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-500">
            <Layers className="size-6 text-slate-400" />
            <p className="text-sm font-medium">Belum ada transaksi</p>
            <p className="text-xs">
              Tambah transaksi pertama dengan tombol di atas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* === Desktop table === */}
          <Card className="hidden md:block border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="max-h-[calc(100vh-22rem)] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 shadow-[0_1px_0_0_rgb(0_0_0_/_0.05)]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead className="min-w-28">No. BKU</TableHead>
                    <TableHead className="min-w-32">Tgl Pesan / Bayar</TableHead>
                    <TableHead className="min-w-48">Uraian</TableHead>
                    <TableHead className="min-w-32">Nama Barang</TableHead>
                    <TableHead className="min-w-32">Vendor</TableHead>
                    <TableHead className="text-right min-w-24">Volume</TableHead>
                    <TableHead className="text-right min-w-28">Tarif</TableHead>
                    <TableHead className="text-right min-w-32">Jumlah</TableHead>
                    <TableHead className="text-center min-w-20">Status</TableHead>
                    <TableHead className="w-10 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, idx) => (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-rose-50/40 dark:hover:bg-rose-950/10 transition-colors"
                    >
                      <TableCell className="text-center text-slate-400 text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        {tx.noBku ? (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          >
                            {tx.noBku}
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span>{formatDateShort(tx.tglPesan) || "—"}</span>
                          {tx.tglBayar && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ↳ {formatDateShort(tx.tglBayar)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="line-clamp-2 cursor-help">
                              {tx.uraian}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">
                            {tx.uraian}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate text-slate-600 dark:text-slate-300">
                        {tx.namaBarang ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate">
                        {tx.vendor?.name ?? (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatNumber(tx.volume)}{" "}
                        <span className="text-slate-400">{tx.satuan}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-600 dark:text-slate-300">
                        {formatRupiah(tx.tarifHarga)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatRupiah(tx.jumlah)}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <RowActions
                          onEdit={() => openEdit(tx)}
                          onDelete={() => {
                            setDeleteTarget(tx);
                            setDeleteOpen(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* === Mobile card list === */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx, idx) => (
              <TransactionCard
                key={tx.id}
                tx={tx}
                no={idx + 1}
                onEdit={() => openEdit(tx)}
                onDelete={() => {
                  setDeleteTarget(tx);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </div>

          {/* === Footer note === */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <strong className="text-slate-700 dark:text-slate-300">{shown}</strong>{" "}
              dari <strong className="text-slate-700 dark:text-slate-300">{formatNumber(totalRows)}</strong>{" "}
              transaksi
            </span>
            {totalRows > 100 && (
              <Badge
                variant="outline"
                className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
              >
                Batas 100 baris — perbaiki filter
              </Badge>
            )}
          </div>
        </>
      )}

      {/* === Add/Edit Dialog === */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-rose-600" />
              {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui data transaksi SPJ"
                : "Isi data transaksi SPJ baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* No BKU */}
            <Field label="No. BKU" full={false}>
              <Input
                value={form.noBku}
                onChange={(e) => update("noBku", e.target.value)}
                placeholder="cth. 001/BKU/2025"
                className="font-mono"
              />
            </Field>

            {/* Bulan */}
            <Field label="Bulan">
              <Select
                value={form.bulan}
                onValueChange={(v) => update("bulan", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {getMonthName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Uraian */}
            <Field label="Uraian *" full>
              <Textarea
                value={form.uraian}
                onChange={(e) => update("uraian", e.target.value)}
                placeholder="cth. Pembelian kertas A4 80gsm untuk kegiatan KBM"
                rows={2}
              />
            </Field>

            {/* Nama Barang */}
            <Field label="Nama Barang">
              <Input
                value={form.namaBarang}
                onChange={(e) => update("namaBarang", e.target.value)}
                placeholder="cth. Kertas A4 80gsm"
              />
            </Field>

            {/* Vendor */}
            <Field label="Vendor">
              <Select
                value={form.vendorId}
                onValueChange={(v) => update("vendorId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Tidak ada —</SelectItem>
                  {(vendorsData?.items ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Volume */}
            <Field label="Volume">
              <Input
                type="number"
                inputMode="decimal"
                value={form.volume}
                onChange={(e) => update("volume", e.target.value)}
                min={0}
                step="any"
              />
            </Field>

            {/* Satuan */}
            <Field label="Satuan">
              <Input
                value={form.satuan}
                onChange={(e) => update("satuan", e.target.value)}
                placeholder="cth. dus, pack, unit"
              />
            </Field>

            {/* Tarif Harga */}
            <Field label="Tarif Harga" full>
              <Input
                type="number"
                inputMode="decimal"
                value={form.tarifHarga}
                onChange={(e) => update("tarifHarga", e.target.value)}
                min={0}
                step="any"
              />
            </Field>

            {/* Jumlah (auto-computed) */}
            <div className="sm:col-span-2">
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  Jumlah (Volume × Tarif)
                </span>
                <span className="font-bold text-rose-700 dark:text-rose-300">
                  {formatRupiah(computedJumlah)}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2 my-1 h-px bg-slate-100 dark:bg-slate-800" />

            {/* Tgl Pesan */}
            <Field label="Tgl Pesan">
              <Input
                type="date"
                value={form.tglPesan}
                onChange={(e) => update("tglPesan", e.target.value)}
              />
            </Field>
            <Field label="No. Pesan">
              <Input
                value={form.noPesan}
                onChange={(e) => update("noPesan", e.target.value)}
                placeholder="cth. 001/Pesan/2025"
                className="font-mono"
              />
            </Field>

            {/* Tgl BAST */}
            <Field label="Tgl BAST">
              <Input
                type="date"
                value={form.tglBast}
                onChange={(e) => update("tglBast", e.target.value)}
              />
            </Field>
            <Field label="No. BAST">
              <Input
                value={form.noBast}
                onChange={(e) => update("noBast", e.target.value)}
                placeholder="cth. 001/BAST/2025"
                className="font-mono"
              />
            </Field>

            {/* Tgl Bayar */}
            <Field label="Tgl Bayar">
              <Input
                type="date"
                value={form.tglBayar}
                onChange={(e) => update("tglBayar", e.target.value)}
              />
            </Field>

            {/* Status */}
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) =>
                  update("status", v as "lunas" | "pending")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !form.uraian.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editingId ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Delete AlertDialog === */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="size-5" />
              Hapus transaksi ini?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>Transaksi yang dihapus tidak dapat dikembalikan.</p>
                {deleteTarget && (
                  <div className="rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-1">
                    <div className="text-xs text-slate-500">Uraian</div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {deleteTarget.uraian}
                    </div>
                    <div className="text-xs text-slate-500 pt-1">Jumlah</div>
                    <div className="font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(deleteTarget.jumlah)}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMut.isPending && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============ Sub-components ============

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
    <div className={full ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs text-slate-600 dark:text-slate-400">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "rose" | "violet" | "emerald";
}) {
  const tones: Record<typeof tone, string> = {
    rose: "border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300",
    violet:
      "border-violet-200 dark:border-violet-900 bg-violet-50/60 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300",
    emerald:
      "border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300",
  };
  return (
    <Card className={`border ${tones[tone]} rounded-xl`}>
      <CardContent className="py-3 px-4 flex items-center gap-3">
        <div className="size-9 rounded-lg flex items-center justify-center bg-white/70 dark:bg-black/20">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {label}
          </div>
          <div className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isLunas = status === "lunas";
  return (
    <Badge
      variant="outline"
      className={
        isLunas
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
      }
    >
      {isLunas ? (
        <>
          <CheckCircle2 className="size-3" /> Lunas
        </>
      ) : (
        <>
          <Eye className="size-3" /> Pending
        </>
      )}
    </Badge>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Aksi</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-rose-600 dark:text-rose-400 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/40"
        >
          <Trash2 className="size-4" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TransactionCard({
  tx,
  no,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  no: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <CardHeader className="py-3 px-4 pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-[10px]"
          >
            #{no}
          </Badge>
          {tx.noBku && (
            <Badge
              variant="outline"
              className="font-mono text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            >
              {tx.noBku}
            </Badge>
          )}
          <StatusBadge status={tx.status} />
        </div>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </CardHeader>
      <CardContent className="px-4 py-3 space-y-2.5">
        <div>
          <div className="font-medium text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
            {tx.uraian}
          </div>
          {tx.namaBarang && (
            <div className="text-xs text-slate-500 mt-0.5">
              <Tag className="inline size-3 mr-1" />
              {tx.namaBarang}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Info
            icon={<CalendarDays className="size-3" />}
            label="Pesan"
            value={formatDateShort(tx.tglPesan) || "—"}
          />
          <Info
            icon={<CalendarDays className="size-3" />}
            label="Bayar"
            value={formatDateShort(tx.tglBayar) || "—"}
          />
          <Info
            icon={<Store className="size-3" />}
            label="Vendor"
            value={tx.vendor?.name ?? "—"}
          />
          <Info
            icon={<Layers className="size-3" />}
            label="Volume"
            value={`${formatNumber(tx.volume)} ${tx.satuan ?? ""}`}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">
              Tarif
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {formatRupiah(tx.tarifHarga)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">
              Jumlah
            </div>
            <div className="font-bold text-rose-600 dark:text-rose-400">
              {formatRupiah(tx.jumlah)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-xs text-slate-700 dark:text-slate-300 truncate">
        {value}
      </div>
    </div>
  );
}

// ============ Utils ============

// Convert ISO date string (or other parseable formats) → yyyy-mm-dd for <input type=date>
function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}
