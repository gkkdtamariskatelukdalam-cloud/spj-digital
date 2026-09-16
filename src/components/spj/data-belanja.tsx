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
import { formatRupiah, formatDate, getMonthName } from "@/lib/format";

export function DataBelanja() {
  const [search, setSearch] = useState("");
  const [bulanFilter, setBulanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const bulan = bulanFilter === "all" ? undefined : parseInt(bulanFilter);
  const status =
    statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading, error } = useTransactions({
    q: search || undefined,
    bulan,
    status,
    limit: 500,
  });

  const transactions = data?.transactions ?? [];

  // Compute stats
  const stats = useMemo(() => {
    const total = transactions.length;
    const draft = transactions.filter((t) => t.status === "draft").length;
    const pending = transactions.filter((t) => t.status === "pending").length;
    const lunas = transactions.filter((t) => t.status === "lunas").length;
    const totalNilai = transactions.reduce(
      (s, t) => s + (t.jumlah || 0),
      0
    );
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
                Semua data hasil import Excel - termasuk yang belum lengkap
                (draft). Lengkapi data draft untuk dipakai di dokumen SPJ.
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
          label="Draft (Belum Lengkap)"
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
                    Draft (Belum Lengkap)
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
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-10 text-xs">No</TableHead>
                    <TableHead className="w-20 text-xs">No. BKU</TableHead>
                    <TableHead className="w-32 text-xs">Tanggal</TableHead>
                    <TableHead className="text-xs min-w-[200px]">Uraian / Nama Barang</TableHead>
                    <TableHead className="w-20 text-xs">Volume</TableHead>
                    <TableHead className="w-28 text-xs">Harga</TableHead>
                    <TableHead className="w-32 text-xs">Jumlah</TableHead>
                    <TableHead className="w-32 text-xs">Vendor</TableHead>
                    <TableHead className="w-24 text-xs">Status</TableHead>
                    <TableHead className="w-16 text-xs">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, i) => (
                    <BelanjaRow
                      key={tx.id}
                      tx={tx}
                      index={i + 1}
                      onEdit={() => setEditingTx(tx)}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
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

  // Check what's missing
  const missing = [];
  if (!tx.uraian) missing.push("uraian");
  if (!tx.namaBarang) missing.push("namaBarang");
  if (!tx.volume) missing.push("volume");
  if (!tx.tarifHarga) missing.push("harga");
  if (!tx.tglPesan) missing.push("tglPesan");
  if (!tx.vendorId) missing.push("vendor");

  return (
    <TableRow
      className={cn(
        "hover:bg-muted/40",
        isDraft && "bg-amber-50/40 dark:bg-amber-950/10"
      )}
    >
      <TableCell className="text-xs font-mono text-muted-foreground">
        {index}
      </TableCell>
      <TableCell className="text-xs font-mono">
        {tx.noBku || <span className="text-muted-foreground/40">—</span>}
      </TableCell>
      <TableCell className="text-xs">
        {tx.tglPesan ? (
          formatDate(tx.tglPesan)
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        <div className="font-medium truncate max-w-[200px]" title={tx.uraian}>
          {tx.uraian || <span className="text-muted-foreground/40 italic">Belum diisi</span>}
        </div>
        {tx.namaBarang && (
          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
            {tx.namaBarang}
          </div>
        )}
      </TableCell>
      <TableCell className="text-xs font-mono text-center">
        {tx.volume > 0 ? (
          `${tx.volume} ${tx.satuan || ""}`
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs font-mono text-right">
        {tx.tarifHarga > 0 ? (
          formatRupiah(tx.tarifHarga)
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs font-mono text-right font-semibold">
        {tx.jumlah > 0 ? (
          <span className="text-rose-700 dark:text-rose-300">
            {formatRupiah(tx.jumlah)}
          </span>
        ) : (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {tx.vendor?.name || (
          <span className="text-muted-foreground/40">—</span>
        )}
      </TableCell>
      <TableCell>
        {isDraft ? (
          <Badge
            variant="outline"
            className="text-[9px] border-amber-400 text-amber-700 dark:text-amber-300"
            title={`Belum lengkap: ${missing.join(", ")}`}
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
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 w-7 p-0"
          title={isDraft ? "Lengkapi data" : "Edit data"}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
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

  const [form, setForm] = useState({
    noBku: tx.noBku || "",
    noPesan: tx.noPesan || "",
    tglPesan: tx.tglPesan && tx.tglPesan.includes("-")
      ? tx.tglPesan.substring(0, 10)
      : tx.tglPesan || "",
    tglBast: tx.tglBast && tx.tglBast.includes("-")
      ? tx.tglBast.substring(0, 10)
      : tx.tglBast || "",
    tglBayar: tx.tglBayar && tx.tglBayar.includes("-")
      ? tx.tglBayar.substring(0, 10)
      : tx.tglBayar || "",
    uraian: tx.uraian || "",
    namaBarang: tx.namaBarang || "",
    volume: String(tx.volume || 0),
    satuan: tx.satuan || "",
    tarifHarga: String(tx.tarifHarga || 0),
    vendorId: tx.vendorId || "__none__",
    bulan: String(tx.bulan || ""),
    status: tx.status || "pending",
  });

  const computedJumlah =
    (parseFloat(form.volume) || 0) * (parseFloat(form.tarifHarga) || 0);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: tx.id,
        data: {
          noBku: form.noBku || null,
          noPesan: form.noPesan || null,
          tglPesan: form.tglPesan || null,
          tglBast: form.tglBast || null,
          tglBayar: form.tglBayar || null,
          uraian: form.uraian,
          namaBarang: form.namaBarang || null,
          volume: parseFloat(form.volume) || 0,
          satuan: form.satuan || null,
          tarifHarga: parseFloat(form.tarifHarga) || 0,
          jumlah: computedJumlah,
          realisasi: computedJumlah,
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-violet-600" />
            Edit Data Belanja
            {tx.status === "draft" && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                Draft - Lengkapi data
              </Badge>
            )}
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
            <Label className="text-xs">Tgl BAST</Label>
            <Input
              type="date"
              value={form.tglBast}
              onChange={(e) => setForm({ ...form, tglBast: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Tgl Bayar</Label>
            <Input
              type="date"
              value={form.tglBayar}
              onChange={(e) => setForm({ ...form, tglBayar: e.target.value })}
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

function AddBelanjaDialog({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateTransaction();
  const { data: vendorsData } = useVendors();
  const vendors = vendorsData?.items ?? [];

  const [form, setForm] = useState({
    noBku: "",
    noPesan: "",
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
        tglPesan: form.tglPesan || null,
        uraian: form.uraian,
        namaBarang: form.namaBarang || null,
        volume: parseFloat(form.volume) || 0,
        satuan: form.satuan || null,
        tarifHarga: parseFloat(form.tarifHarga) || 0,
        jumlah: computedJumlah,
        realisasi: computedJumlah,
        vendorId: form.vendorId && form.vendorId !== "__none__" ? form.vendorId : null,
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
