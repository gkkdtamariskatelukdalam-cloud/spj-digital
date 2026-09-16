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
import { toast } from "sonner";
import {
  FileText,
  Printer,
  Search,
  Package,
  ChevronRight,
  AlertCircle,
  Loader2,
  CalendarDays,
  Store,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDocumentGroups,
  useSchool,
  useAllPrintStatuses,
  useMarkPrinted,
} from "@/hooks/use-spj";
import { formatRupiah, formatDate, getMonthName } from "@/lib/format";
import type { DocumentGroup } from "@/lib/types/spj";

// Document templates
import { SuratPesanan } from "@/components/spj/docs/surat-pesanan";
import { DokumenPembanding } from "@/components/spj/docs/dokumen-pembanding";
import { DokumenRencana } from "@/components/spj/docs/dokumen-rencana";
import { SuratHasilPemeriksaan } from "@/components/spj/docs/surat-hasil-pemeriksaan";
import { BeritaAcaraSerahTerima } from "@/components/spj/docs/berita-acara-serah-terima";
import { SuratPenawaranToko } from "@/components/spj/docs/surat-penawaran-toko";
import { SuratPertanggungjawaban } from "@/components/spj/docs/surat-pertanggungjawaban";
import { Kuitansi } from "@/components/spj/docs/kuitansi";

type DocType =
  | "surat-pesanan"
  | "dokumen-pembanding"
  | "dokumen-rencana"
  | "surat-hasil-pemeriksaan"
  | "berita-acara-serah-terima"
  | "surat-penawaran-toko"
  | "surat-pertanggungjawaban"
  | "kuitansi";

interface DocTypeMeta {
  id: DocType;
  label: string;
  short: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  desc: string;
}

const DOC_TYPES: DocTypeMeta[] = [
  {
    id: "surat-pesanan",
    label: "Surat Pesanan",
    short: "01 PESAN",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    desc: "Surat pemesanan barang/jasa",
  },
  {
    id: "dokumen-pembanding",
    label: "Dokumen Pembanding",
    short: "02 BANDING",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    desc: "Hasil perbandingan harga",
  },
  {
    id: "dokumen-rencana",
    label: "Dokumen Rencana",
    short: "03 RENCANA",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800",
    desc: "Rencana pembelian",
  },
  {
    id: "surat-hasil-pemeriksaan",
    label: "Surat Hasil Pemeriksaan",
    short: "04 SHP",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-cyan-700 dark:text-cyan-300",
    bg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800",
    desc: "Surat hasil pemeriksaan barang",
  },
  {
    id: "berita-acara-serah-terima",
    label: "Berita Acara Serah Terima",
    short: "05 BAST",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    desc: "Berita acara serah terima",
  },
  {
    id: "surat-penawaran-toko",
    label: "Surat Penawaran Toko",
    short: "TOKO",
    icon: <Store className="h-3.5 w-3.5" />,
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800",
    desc: "Surat penawaran dari vendor",
  },
  {
    id: "surat-pertanggungjawaban",
    label: "Surat Pertanggungjawaban",
    short: "SPJ",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    desc: "Surat pertanggungjawaban pengeluaran",
  },
  {
    id: "kuitansi",
    label: "Kuitansi",
    short: "KUITANSI",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    desc: "Tanda Pembayaran / Kuitansi",
  },
];

export function Documents() {
  const [bulanFilter, setBulanFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType>("surat-pesanan");

  const bulan = bulanFilter === "all" ? undefined : parseInt(bulanFilter);
  const groupsQ = useDocumentGroups(bulan, search || undefined);
  const schoolQ = useSchool();
  const printStatusQ = useAllPrintStatuses();
  const markPrintedMutation = useMarkPrinted();

  const groups = groupsQ.data?.groups ?? [];
  const school = schoolQ.data?.item ?? null;
  const printStatuses = printStatusQ.data?.allStatuses ?? {};
  const selectedGroup = useMemo(
    () => groups.find((g) => g.key === selectedKey) ?? null,
    [groups, selectedKey]
  );

  const handlePrint = () => {
    if (!selectedGroup) {
      toast.error("Pilih dokumen terlebih dahulu");
      return;
    }
    // Mark document as printed
    const gKey = selectedGroup.noPesan || selectedGroup.noBku || selectedGroup.key;
    markPrintedMutation.mutate({ groupKey: gKey, docType });
    
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-rose-600" />
                Cetak Dokumen SPJ
              </CardTitle>
              <CardDescription className="text-sm">
                Pilih grup transaksi, lalu pilih jenis dokumen untuk dicetak.
                Semua template mengikuti format asli Excel.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {groupsQ.data?.summary.totalGroups ?? 0} grup
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {DOC_TYPES.length} jenis dokumen
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: filter + transaction group list */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3 print:hidden">
          <Card>
            <CardHeader className="pb-2">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari no pesan, BPU, vendor..."
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
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {groupsQ.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : groupsQ.isError ? (
                  <div className="p-4 text-center text-sm text-rose-600">
                    <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                    Gagal memuat data
                  </div>
                ) : groups.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Tidak ada grup transaksi
                  </div>
                ) : (
                  <div className="space-y-1 px-2 pb-2">
                    {groups.map((g) => (
                      <GroupButton
                        key={g.key}
                        group={g}
                        active={selectedKey === g.key}
                        printStatuses={printStatuses}
                        onClick={() => setSelectedKey(g.key)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right: doc type picker + preview */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          {/* Doc type picker */}
          <Card className="print:hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-600" />
                Pilih Jenis Dokumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {DOC_TYPES.map((dt) => {
                  const gKey = selectedGroup?.noPesan || selectedGroup?.noBku || selectedGroup?.key || "";
                  const isDocPrinted = printStatuses[gKey]?.[dt.id]?.printed === true;
                  
                  return (
                    <button
                      key={dt.id}
                      onClick={() => setDocType(dt.id)}
                      disabled={!selectedGroup}
                      className={cn(
                        "text-left rounded-md border px-2.5 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative",
                        docType === dt.id
                          ? dt.bg + " " + dt.color
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {dt.icon}
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wide">
                          {dt.short}
                        </span>
                        {/* Print status indicator */}
                        {isDocPrinted && (
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500 ml-auto" />
                        )}
                      </div>
                      <div className="text-[11px] font-semibold leading-tight">
                        {dt.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                        {isDocPrinted ? "Sudah dicetak" : dt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Action bar */}
          {selectedGroup && (
            <Card className="print:hidden">
              <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono font-semibold">
                      Pesan #{selectedGroup.noPesan || "—"}
                    </span>
                    {selectedGroup.bpuCode && (
                      <Badge variant="outline" className="text-[9px] font-mono">
                        {selectedGroup.bpuCode}
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(selectedGroup.tglPesan)} · {selectedGroup.itemCount} item
                    {" · "}
                    <span className="text-rose-700 dark:text-rose-300 font-semibold">
                      {formatRupiah(selectedGroup.totalJumlah)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handlePrint}
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" />
                    Cetak Dokumen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Document preview */}
          {!selectedGroup ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h2 className="text-lg font-semibold">Pilih Grup Transaksi</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Pilih grup transaksi dari panel kiri untuk menampilkan pratinjau
                  dokumen yang dapat dicetak.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div id="spj-document-print" className="bg-white text-slate-900">
                  {docType === "surat-pesanan" && (
                    <SuratPesanan group={selectedGroup} school={school} />
                  )}
                  {docType === "dokumen-pembanding" && (
                    <DokumenPembanding group={selectedGroup} school={school} />
                  )}
                  {docType === "dokumen-rencana" && (
                    <DokumenRencana group={selectedGroup} school={school} />
                  )}
                  {docType === "surat-hasil-pemeriksaan" && (
                    <SuratHasilPemeriksaan group={selectedGroup} school={school} />
                  )}
                  {docType === "berita-acara-serah-terima" && (
                    <BeritaAcaraSerahTerima group={selectedGroup} school={school} />
                  )}
                  {docType === "surat-penawaran-toko" && (
                    <SuratPenawaranToko group={selectedGroup} school={school} />
                  )}
                  {docType === "surat-pertanggungjawaban" && (
                    <SuratPertanggungjawaban group={selectedGroup} school={school} />
                  )}
                  {docType === "kuitansi" && (
                    <Kuitansi group={selectedGroup} school={school} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Doc IDs for print status check
const DOC_IDS = [
  "surat-pesanan",
  "dokumen-pembanding",
  "dokumen-rencana",
  "surat-hasil-pemeriksaan",
  "berita-acara-serah-terima",
  "surat-penawaran-toko",
  "surat-pertanggungjawaban",
  "kuitansi",
];

function GroupButton({
  group: g,
  active,
  printStatuses,
  onClick,
}: {
  group: DocumentGroup;
  active: boolean;
  printStatuses: Record<string, Record<string, { printed: boolean; printedAt: string }>>;
  onClick: () => void;
}) {
  const gKey = g.noPesan || g.noBku || g.key;
  const groupStatuses = printStatuses[gKey] || {};
  const printedCount = DOC_IDS.filter((d) => groupStatuses[d]?.printed).length;
  const totalCount = DOC_IDS.length;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-2 rounded-md transition-all border text-xs",
        active
          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className={cn(
              "font-mono font-bold",
              active ? "text-rose-700 dark:text-rose-300" : "text-foreground"
            )}
          >
            #{g.noPesan || "—"}
          </span>
          {g.bulan && (
            <span className="text-[9px] text-muted-foreground">
              {getMonthName(g.bulan).slice(0, 3)}
            </span>
          )}
        </div>
        {/* Print status badge */}
        <span
          className={cn(
            "text-[8px] font-mono px-1 py-0.5 rounded",
            printedCount === totalCount
              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
              : printedCount > 0
              ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
              : "bg-muted text-muted-foreground"
          )}
          title={`${printedCount}/${totalCount} dokumen sudah dicetak`}
        >
          {printedCount === totalCount ? (
            <span className="flex items-center gap-0.5">
              <CheckCircle2 className="h-2 w-2" />
              {printedCount}/{totalCount}
            </span>
          ) : (
            `${printedCount}/${totalCount}`
          )}
        </span>
        <ChevronRight
          className={cn(
            "h-3 w-3 flex-shrink-0",
            active ? "text-rose-600" : "text-muted-foreground/40"
          )}
        />
      </div>
      {g.vendorName && (
        <div className="text-[10px] text-muted-foreground truncate">
          {g.vendorName}
        </div>
      )}
      <div className="flex items-center justify-between mt-0.5 gap-2">
        <span className="text-[9px] text-muted-foreground">
          {g.itemCount} item
        </span>
        <span className="text-[10px] font-mono font-semibold text-rose-700 dark:text-rose-300">
          {formatRupiah(g.totalJumlah)}
        </span>
      </div>
    </button>
  );
}
