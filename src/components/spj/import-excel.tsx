"use client";

import { useState, useRef } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  Eye,
  DatabaseIcon,
  Store,
  Hash,
  Wallet,
  RotateCcw,
  LayoutDashboard,
  Receipt,
  Database,
  FileText,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { formatRupiah } from "@/lib/format";

interface PreviewRow {
  noPesan: string;
  noBku: string;
  uraian: string;
  namaBarang: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  jumlah: number;
  vendorName: string;
}

interface PreviewResult {
  sheetName: string;
  totalRows: number;
  totalVendors: number;
  totalBpu: number;
  totalAmount: number;
  preview: PreviewRow[];
  detectedColumns: Record<string, boolean>;
}

interface ImportResult {
  success: boolean;
  summary: {
    totalRows: number;
    transactionsImported: number;
    transactionsUpdated: number;
    transactionsUnchanged?: number;
    transactionsSkipped?: number;
    vendorsCreated?: number;
    vendorsImported?: number;
    vendorsUpdated?: number;
    bpuImported?: number;
    bpuCreated?: number;
    sheetName: string;
    bospYear?: string | null;
    dedupStrategy?: string;
  };
}

export function ImportExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFile = (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("File harus berformat .xlsx atau .xls");
      return;
    }

    setFile(selectedFile);
    setPreview(null);
    setImportResult(null);
    setError(null);
    // Auto-preview
    previewFile(selectedFile);
  };

  const previewFile = async (selectedFile: File) => {
    setPreviewLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/spj/import/preview", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal parse Excel");
      }
      setPreview(data as PreviewResult);
      toast.success(`File berhasil di-parse: ${data.totalRows} baris data`);
    } catch (e) {
      setError((e as Error).message);
      toast.error("Gagal parse Excel: " + (e as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    // Confirm
    if (
      !confirm(
        `Import ${preview?.totalRows || 0} baris data dari Excel? Data akan ditambahkan ke database.`
      )
    )
      return;

    setImportLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/spj/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal import Excel");
      }
      setImportResult(data as ImportResult);
      toast.success(
        `Berhasil import ${data.summary.transactionsImported} transaksi!`,
        { duration: 4000 }
      );
    } catch (e) {
      setError((e as Error).message);
      toast.error("Gagal import: " + (e as Error).message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetDatabase = async () => {
    if (
      !confirm(
        "Reset SEMUA data transaksi, vendor, dan BPU? Data sekolah, produk, dan pengaturan KOP tidak akan dihapus. Tindakan ini TIDAK BISA dibatalkan."
      )
    )
      return;

    setResetLoading(true);
    try {
      const res = await fetch("/api/spj/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal reset");
      toast.success(data.message || "Database berhasil di-reset", {
        duration: 4000,
      });
      // Clear local state
      setImportResult(null);
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      toast.error("Gagal reset: " + (e as Error).message);
    } finally {
      setResetLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      toast.info("Mengunduh template Excel...");
      const res = await fetch("/api/spj/import/template", {
        method: "GET",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengunduh template");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_import_SPJ_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template berhasil diunduh!", {
        description: "Buka file, hapus baris contoh, lalu isi data Anda.",
        duration: 4000,
      });
    } catch (e) {
      toast.error("Gagal mengunduh template: " + (e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-600" />
                Import Excel
              </CardTitle>
              <CardDescription className="text-sm">
                Upload file Excel (.xlsx) untuk import data transaksi, vendor,
                dan BPU secara massal. Semua kolom &amp; baris akan masuk
                walau ada sel kosong. Import ulang setelah mengisi data kosong
                akan otomatis <b className="text-violet-700 dark:text-violet-300">update (anti-duplikat)</b> —
                matched via No. Pesanan + BPU + Nama Barang (atau nomor baris Excel).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="h-8 text-xs border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
              >
                <Download className="h-3 w-3 mr-1" />
                Download Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDatabase}
                disabled={resetLoading}
                className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
              >
                {resetLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Reset Database
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info: Kemana Data Masuk */}
      <Card className="border-l-4 border-l-violet-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <DatabaseIcon className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                  Saat import, data masuk ke mana?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Data hasil import tersimpan di database dan otomatis muncul
                  di 5 tab berikut:
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="flex items-start gap-2 p-2 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                  <LayoutDashboard className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                      Dashboard
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Total pengeluaran, jumlah transaksi, chart bulanan, top
                      vendor akan update
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                  <Receipt className="h-4 w-4 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                      Transaksi
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Daftar lengkap pengeluaran dengan filter bulan, vendor,
                      status
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      Dokumen SPJ
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Grup transaksi siap untuk cetak Surat Pesanan, BAST,
                      SHP, SPJ
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <BarChart3 className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Laporan
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Rekap bulanan, per vendor, per kategori, status SPJ
                      update
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                  <Database className="h-4 w-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                      Master Data
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Vendor baru &amp; kode BPU baru otomatis masuk ke daftar
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
                  <DatabaseIcon className="h-4 w-4 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Database (SQLite)
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      File:{" "}
                      <code className="font-mono text-[9px]">
                        db/custom.db
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload area */}
      <Card>
        <CardContent className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all"
            >
              <FileSpreadsheet className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium">
                Klik untuk pilih file atau drag & drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Format: .xlsx atau .xls (Max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                    {preview && ` · ${preview.totalRows} baris data`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Loading preview */}
              {previewLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Memparse Excel...
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Gagal</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Preview results */}
              {preview && !previewLoading && (
                <PreviewResults preview={preview} />
              )}

              {/* Import result */}
              {importResult && (
                <div className="space-y-3">
                  <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle className="text-emerald-700 dark:text-emerald-300">
                      Import Berhasil!
                    </AlertTitle>
                    <AlertDescription>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-xs">
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            {importResult.summary.transactionsImported}
                          </span>{" "}
                          transaksi baru
                        </div>
                        <div>
                          <span className="font-bold text-violet-700 dark:text-violet-300">
                            {importResult.summary.transactionsUpdated}
                          </span>{" "}
                          diperbarui
                        </div>
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            {importResult.summary.vendorsCreated ??
                              importResult.summary.vendorsImported ??
                              0}
                          </span>{" "}
                          vendor baru
                          {importResult.summary.vendorsUpdated ? (
                            <span className="text-violet-600 dark:text-violet-400">
                              {" "}
                              +{importResult.summary.vendorsUpdated} update
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            {importResult.summary.bpuCreated ??
                              importResult.summary.bpuImported ??
                              0}
                          </span>{" "}
                          BPU baru
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {importResult.summary.transactionsUnchanged ?? 0} unchanged
                          </span>
                        </div>
                      </div>
                      {importResult.summary.transactionsUpdated > 0 && (
                        <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-2">
                          ✓ {importResult.summary.transactionsUpdated} transaksi diperbarui
                          (matched via <code className="text-[9px] bg-violet-100 dark:bg-violet-900/40 px-1 rounded">{importResult.summary.dedupStrategy ?? "row number + composite key"}</code>) — tidak ada duplikat
                        </p>
                      )}
                      {importResult.summary.bospYear && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                          📅 Tahun BOSP aktif: <b>{importResult.summary.bospYear}</b> — semua transaksi di-link ke tahun ini
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* Where data went */}
                  <Alert className="border-violet-300 bg-violet-50 dark:bg-violet-950/30">
                    <DatabaseIcon className="h-4 w-4 text-violet-600" />
                    <AlertTitle className="text-violet-700 dark:text-violet-300 text-sm">
                      Data telah masuk ke aplikasi!
                    </AlertTitle>
                    <AlertDescription>
                      <p className="text-xs mt-1 mb-2 text-muted-foreground">
                        Data hasil import sekarang tersimpan di database dan
                        muncul di tab berikut:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <LayoutDashboard className="h-3 w-3 text-rose-500" />
                          <span><b>Dashboard</b> — statistik &amp; chart update</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Receipt className="h-3 w-3 text-violet-500" />
                          <span><b>Transaksi</b> — daftar lengkap pengeluaran</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-emerald-500" />
                          <span><b>Dokumen SPJ</b> — grup transaksi untuk cetak</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="h-3 w-3 text-amber-500" />
                          <span><b>Laporan</b> — rekap &amp; analisa</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Database className="h-3 w-3 text-cyan-500" />
                          <span><b>Master Data</b> — vendor &amp; BPU baru</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Actions */}
              {preview && !importResult && (
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={importLoading}
                    size="sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importLoading}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <DatabaseIcon className="h-3.5 w-3.5 mr-1" />
                        Import {preview.totalRows} Baris
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* After import - done button */}
              {importResult && (
                <div className="flex items-center gap-2 justify-end">
                  <Button onClick={handleReset} size="sm" variant="outline">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Import File Lain
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewResults({ preview }: { preview: PreviewResult }) {
  const cols = preview.detectedColumns;
  const allDetected = Object.values(cols).every((v) => v);

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          icon={<DatabaseIcon className="h-3.5 w-3.5" />}
          label="Total Baris"
          value={preview.totalRows}
          color="text-violet-700 dark:text-violet-300"
          bg="bg-violet-50 dark:bg-violet-950/40"
        />
        <StatCard
          icon={<Store className="h-3.5 w-3.5" />}
          label="Vendor"
          value={preview.totalVendors}
          color="text-amber-700 dark:text-amber-300"
          bg="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          icon={<Hash className="h-3.5 w-3.5" />}
          label="BPU Codes"
          value={preview.totalBpu}
          color="text-cyan-700 dark:text-cyan-300"
          bg="bg-cyan-50 dark:bg-cyan-950/40"
        />
        <StatCard
          icon={<Wallet className="h-3.5 w-3.5" />}
          label="Total Nilai"
          value={formatRupiah(preview.totalAmount)}
          color="text-rose-700 dark:text-rose-300"
          bg="bg-rose-50 dark:bg-rose-950/40"
          isString
        />
      </div>

      {/* Column detection */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground">
          Kolom terdeteksi:
        </span>
        {Object.entries(cols).map(([key, detected]) => (
          <Badge
            key={key}
            variant="outline"
            className={
              detected
                ? "text-[9px] border-emerald-400 text-emerald-700 dark:text-emerald-300"
                : "text-[9px] border-rose-400 text-rose-700 dark:text-rose-300"
            }
          >
            {detected ? "✓" : "✗"} {key}
          </Badge>
        ))}
      </div>

      {!allDetected && (
        <Alert variant="default" className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
            Beberapa kolom tidak terdeteksi. Data tetap bisa diimport tetapi
            beberapa field mungkin kosong.
          </AlertDescription>
        </Alert>
      )}

      {/* Preview table */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">
            Pratinjau Data (10 baris pertama dari {preview.totalRows})
          </span>
        </div>
        <ScrollArea className="h-[300px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="text-xs w-12">No</TableHead>
                <TableHead className="text-xs">No. BKU</TableHead>
                <TableHead className="text-xs">Uraian</TableHead>
                <TableHead className="text-xs">Nama Barang</TableHead>
                <TableHead className="text-xs w-20">Vol</TableHead>
                <TableHead className="text-xs w-20">Satuan</TableHead>
                <TableHead className="text-xs w-28">Harga</TableHead>
                <TableHead className="text-xs w-32">Jumlah</TableHead>
                <TableHead className="text-xs">Vendor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.preview.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono">
                    {row.noPesan || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {row.noBku || "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={row.uraian}>
                    {row.uraian || "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate" title={row.namaBarang}>
                    {row.namaBarang || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-center">
                    {row.volume || "—"}
                  </TableCell>
                  <TableCell className="text-xs">{row.satuan || "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-right">
                    {row.hargaSatuan > 0 ? formatRupiah(row.hargaSatuan) : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right font-semibold text-rose-700 dark:text-rose-300">
                    {row.jumlah > 0 ? formatRupiah(row.jumlah) : "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate" title={row.vendorName}>
                    {row.vendorName || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
  isString,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  isString?: boolean;
}) {
  return (
    <div className={`rounded-md border px-3 py-2 ${bg}`}>
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wide font-bold">
          {label}
        </span>
      </div>
      <div className={`font-bold font-mono ${color} ${isString ? "text-sm" : "text-lg"}`}>
        {value}
      </div>
    </div>
  );
}
