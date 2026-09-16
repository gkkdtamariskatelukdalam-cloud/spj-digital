"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Hash,
  Layers,
  Loader2,
  Printer,
  Search,
  Stamp,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  useCreateDocument,
  useSchool,
  useTransactionDetail,
  useTransactions,
} from "@/hooks/use-spj";
import type { Document, School, Transaction } from "@/lib/types/spj";
import {
  formatDate,
  formatNumber,
  formatRupiah,
  getMonthName,
  terbilang,
} from "@/lib/format";

// ============================================================
// Constants & helpers
// ============================================================

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const ROMAN: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
};

function toRoman(n: number | null | undefined): string {
  if (!n || n < 1 || n > 12) return "I";
  return ROMAN[n] ?? "I";
}

// Build the SPJ document number from a transaction
function buildSpjNumber(tx: Transaction): string {
  const bku = tx.noBku?.trim() || String(tx.noUrut ?? tx.id.slice(-6));
  const roman = toRoman(tx.bulan);
  return `SPJ-${bku}/${roman}/${tx.tahun}`;
}

// Pick the most relevant date for the SPJ doc (prefer payment, fallback to BAST/Pesan/today)
function pickSpjDate(tx: Transaction): string {
  return tx.tglBayar || tx.tglBast || tx.tglPesan || new Date().toISOString();
}

// Capitalize first letter (terbilang returns lowercase)
function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================
// Main component
// ============================================================

export function Documents() {
  // ============ Filter state ============
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [bulan, setBulan] = useState<string>("all");

  // ============ Selection ============
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ============ Queries ============
  const query = useMemo(
    () => ({
      q: q || undefined,
      bulan: bulan !== "all" ? Number(bulan) : undefined,
      limit: 100,
    }),
    [q, bulan]
  );

  const { data, isLoading, isError, error, refetch } = useTransactions(query);
  const { data: schoolData } = useSchool();
  // Fetch the selected transaction with its documents included
  const detailQ = useTransactionDetail(selectedId);

  const transactions = data?.transactions ?? [];
  const school = schoolData?.item ?? null;

  const selected = transactions.find((t) => t.id === selectedId) ?? null;
  const selectedDetail = detailQ.data?.transaction ?? null;
  const selectedSpjDocs: Document[] = useMemo(() => {
    if (!selectedDetail?.documents) return [];
    return selectedDetail.documents.filter((d) => d.type === "SPJ");
  }, [selectedDetail]);
  const hasSpjDoc = selectedSpjDocs.length > 0;

  // ============ Mutation: create SPJ document record ============
  const createDocMut = useCreateDocument();

  // ============ Handlers ============
  function handlePrint() {
    if (!selected) {
      toast.error("Pilih transaksi dulu untuk mencetak SPJ");
      return;
    }
    window.print();
  }

  function handleMarkPrinted() {
    if (!selected) {
      toast.error("Pilih transaksi dulu");
      return;
    }
    if (!school) {
      toast.error("Data sekolah belum diisi. Lengkapi di tab Master Data.");
      return;
    }
    const docNumber = buildSpjNumber(selected);
    createDocMut.mutate(
      {
        transactionId: selected.id,
        type: "SPJ",
        docNumber,
        docDate: pickSpjDate(selected),
        amount: selected.jumlah,
        status: "printed",
      },
      {
        onSuccess: () =>
          toast.success("SPJ ditandai sudah dicetak", {
            description: `No. ${docNumber}`,
          }),
        onError: (e: Error) =>
          toast.error("Gagal menyimpan dokumen", { description: e.message }),
      }
    );
  }

  // ============ Render ============
  return (
    <div className="space-y-4">
      {/* === Inject print CSS (only applies during window.print) === */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* === Header === */}
      <Card className="print:hidden border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/60 backdrop-blur sticky top-0 z-30 rounded-xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="inline-flex size-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                  <FileText className="size-4" />
                </span>
                Dokumen Pertanggungjawaban (SPJ)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Pilih transaksi untuk membuat/melihat dokumen SPJ
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900 text-violet-700 dark:text-violet-300"
              >
                <Layers className="size-3 mr-1" />
                {transactions.length} transaksi
              </Badge>
              {hasSpjDoc && selected && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 className="size-3 mr-1" />
                  SPJ sudah dibuat
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
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
            <div className="w-full sm:w-44">
              <Label className="text-xs text-slate-500 mb-1 block">
                Filter Bulan
              </Label>
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
          </div>
        </CardContent>
      </Card>

      {/* === Main grid: list + preview === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* === Transaction list (left) === */}
        <div className="print:hidden lg:col-span-1 space-y-2">
          <Card className="border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="size-4 text-slate-500" />
                Daftar Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="size-6 animate-spin text-rose-500" />
                  <p className="text-sm">Memuat transaksi...</p>
                </div>
              ) : isError ? (
                <div className="py-12 flex flex-col items-center gap-3 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="size-6" />
                  <p className="text-sm">Gagal memuat transaksi</p>
                  <p className="text-xs text-slate-500">
                    {(error as Error)?.message ?? "Unknown error"}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Coba lagi
                  </Button>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
                  <Layers className="size-6 text-slate-400" />
                  <p className="text-sm font-medium">Belum ada transaksi</p>
                  <p className="text-xs">
                    Tambah transaksi di tab Transaksi terlebih dahulu.
                  </p>
                </div>
              ) : (
                <div
                  className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2 space-y-1.5"
                  // Horizontal scroll strip on mobile
                  data-list="root"
                >
                  <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
                    {transactions.map((tx) => (
                      <TransactionChip
                        key={tx.id}
                        tx={tx}
                        active={tx.id === selectedId}
                        onSelect={() => setSelectedId(tx.id)}
                      />
                    ))}
                  </div>
                  <div className="hidden md:block space-y-1.5">
                    {transactions.map((tx) => (
                      <TransactionListItem
                        key={tx.id}
                        tx={tx}
                        active={tx.id === selectedId}
                        onSelect={() => setSelectedId(tx.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === SPJ preview (right) === */}
        <div className="lg:col-span-2 space-y-3">
          {/* Action bar */}
          <Card className="print:hidden border-slate-200 dark:border-slate-800 rounded-xl">
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                {selected ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    >
                      <Hash className="size-3 mr-1" />
                      {selected.noBku || "tanpa BKU"}
                    </Badge>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {selected.uraian}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        selected.status === "lunas"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
                          : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300"
                      }
                    >
                      {selected.status === "lunas" ? "Lunas" : "Pending"}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">
                    Belum ada transaksi dipilih
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  disabled={!selected}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <Printer className="size-4" />
                  Cetak SPJ
                </Button>
                <Button
                  onClick={handleMarkPrinted}
                  disabled={!selected || !school || createDocMut.isPending || hasSpjDoc}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {createDocMut.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Stamp className="size-4" />
                  )}
                  {hasSpjDoc ? "Sudah Ditandai" : "Tandai Sudah Dicetak"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview / Empty */}
          {!selected ? (
            <Card className="print:hidden border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
              <CardContent className="py-20 flex flex-col items-center gap-3 text-slate-500 text-center">
                <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FileText className="size-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium">
                  Pilih transaksi untuk melihat dokumen SPJ
                </p>
                <p className="text-xs max-w-sm">
                  Klik salah satu item di daftar sebelah kiri untuk memuat
                  pratinjau Surat Pertanggungjawaban yang siap dicetak.
                </p>
              </CardContent>
            </Card>
          ) : detailQ.isLoading ? (
            <Card className="print:hidden border-slate-200 dark:border-slate-800 rounded-xl">
              <CardContent className="py-20 flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="size-6 animate-spin text-rose-500" />
                <p className="text-sm">Memuat dokumen SPJ...</p>
              </CardContent>
            </Card>
          ) : detailQ.isError ? (
            <Card className="print:hidden border-rose-200 dark:border-rose-900 rounded-xl">
              <CardContent className="py-16 flex flex-col items-center gap-3 text-rose-700 dark:text-rose-300">
                <AlertCircle className="size-6" />
                <p className="text-sm">Gagal memuat dokumen</p>
                <p className="text-xs text-slate-500">
                  {(detailQ.error as Error)?.message ?? "Unknown error"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => detailQ.refetch()}
                >
                  Coba lagi
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <CardContent className="p-0">
                {/* === Printable area === */}
                <div id="spj-document-print" className="bg-white text-slate-900">
                  <SpjDocument
                    tx={selected}
                    school={school}
                    spjDoc={selectedSpjDocs[0] ?? null}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SPJ Document (the printable area)
// ============================================================

function SpjDocument({
  tx,
  school,
  spjDoc,
}: {
  tx: Transaction;
  school: School | null;
  spjDoc: Document | null;
}) {
  // School info with sensible fallbacks if not configured yet
  const schoolName = school?.name ?? "SMA NEGERI 1 TELUKDALAM";
  const schoolAddress =
    school?.address ??
    "Jl. Pendidikan No. 13 Kelurahan Pasar Telukdalam Kecamatan Teluk Dalam";
  const year = tx.tahun || school?.year || new Date().getFullYear();
  const docNumber = spjDoc?.docNumber ?? buildSpjNumber(tx);
  const spjDate = spjDoc?.docDate ?? pickSpjDate(tx);
  const total = tx.jumlah || tx.volume * tx.tarifHarga || 0;

  return (
    <div className="px-6 sm:px-10 py-8 sm:py-10 text-[12px] sm:text-[13px] leading-relaxed text-slate-900 print:px-8 print:py-8">
      {/* === Kop Surat === */}
      <header className="text-center border-b-2 border-slate-800 pb-3 mb-5">
        <div className="font-bold uppercase text-[13px] sm:text-[15px] tracking-wide">
          PEMERINTAH PROVINSI SUMATERA UTARA
        </div>
        <div className="font-bold uppercase text-[13px] sm:text-[15px] tracking-wide">
          DINAS PENDIDIKAN
        </div>
        <div className="font-bold uppercase text-[14px] sm:text-[17px] tracking-wide">
          {schoolName}
        </div>
        <div className="text-[11px] sm:text-[12px] text-slate-700 mt-1">
          {schoolAddress}
        </div>
      </header>

      {/* === Title === */}
      <div className="text-center mb-4">
        <h1 className="font-bold uppercase text-[14px] sm:text-[16px] underline underline-offset-4">
          SURAT PERTANGGUNGJAWABAN (SPJ)
        </h1>
        <p className="text-[12px] sm:text-[13px] mt-1">
          Nomor:{" "}
          <span className="font-mono font-semibold">{docNumber}</span>
        </p>
      </div>

      {/* === Opening paragraph === */}
      <p className="text-justify mb-4">
        Setelah diperiksa dengan seksama, maka jumlah pengeluaran yang dibebankan
        pada anggaran BOSP Tahun{" "}
        <span className="font-semibold">{year}</span> adalah sebagai berikut:
      </p>

      {/* === Items table === */}
      <Table className="border-collapse border border-slate-800 text-[11px] sm:text-[12px]">
        <TableHeader>
          <TableRow className="border border-slate-800 bg-slate-100 print:bg-slate-100">
            <TableHead className="border border-slate-800 text-center w-10">
              No
            </TableHead>
            <TableHead className="border border-slate-800 text-center">
              Uraian
            </TableHead>
            <TableHead className="border border-slate-800 text-center w-12">
              Vol
            </TableHead>
            <TableHead className="border border-slate-800 text-center w-20">
              Satuan
            </TableHead>
            <TableHead className="border border-slate-800 text-center w-28">
              Tarif (Rp)
            </TableHead>
            <TableHead className="border border-slate-800 text-center w-32">
              Jumlah (Rp)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="border border-slate-800">
            <TableCell className="border border-slate-800 text-center">
              1
            </TableCell>
            <TableCell className="border border-slate-800">
              <div className="font-medium">{tx.uraian}</div>
              {tx.namaBarang && (
                <div className="text-[10px] text-slate-600 italic">
                  {tx.namaBarang}
                </div>
              )}
            </TableCell>
            <TableCell className="border border-slate-800 text-center tabular-nums">
              {formatNumber(tx.volume)}
            </TableCell>
            <TableCell className="border border-slate-800 text-center">
              {tx.satuan ?? "—"}
            </TableCell>
            <TableCell className="border border-slate-800 text-right tabular-nums">
              {formatNumber(tx.tarifHarga)}
            </TableCell>
            <TableCell className="border border-slate-800 text-right tabular-nums font-medium">
              {formatNumber(tx.jumlah)}
            </TableCell>
          </TableRow>
          {/* Total row */}
          <TableRow className="total-row border border-slate-800 bg-slate-50 font-bold print:bg-slate-50">
            <TableCell
              className="border border-slate-800 text-center"
              colSpan={5}
            >
              JUMLAH TOTAL
            </TableCell>
            <TableCell className="border border-slate-800 text-right tabular-nums">
              {formatNumber(total)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* === Terbilang === */}
      <div className="mt-3 mb-4 text-[12px]">
        <span className="font-semibold">Terbilang:</span>{" "}
        <span className="italic">{capitalize(terbilang(total))}</span>
      </div>

      {/* === Closing paragraph === */}
      <p className="text-justify text-[12px] mb-6">
        Demikian surat pertanggungjawaban ini dibuat dengan sebenarnya untuk
        dapat dipergunakan sebagaimana mestinya.
      </p>

      {/* === Date & signature blocks === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam,</div>
          <div className="font-medium">{formatDate(spjDate)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center text-[12px]">
        {/* Mengetahui - Kepala Sekolah */}
        <div className="signature-block">
          <SignatureBlock
            title="Mengetahui,"
            role="Kepala Sekolah"
            name={school?.principalName ?? "—"}
            nip={school?.principalNip}
          />
        </div>
        {/* Bendahara */}
        <div className="signature-block">
          <SignatureBlock
            title="Bendahara,"
            role="Bendahara Pengeluaran"
            name={school?.treasurerName ?? "—"}
            nip={school?.treasurerNip}
          />
        </div>
        {/* Penerima */}
        <div className="signature-block">
          <SignatureBlock
            title="Penerima,"
            role={tx.vendor?.name ?? "—"}
            name={tx.vendor?.owner ?? "—"}
            phone={tx.vendor?.phone}
          />
        </div>
      </div>
    </div>
  );
}

function SignatureBlock({
  title,
  role,
  name,
  nip,
  phone,
}: {
  title: string;
  role: string;
  name: string;
  nip?: string | null;
  phone?: string | null;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-medium">{title}</div>
      <div className="text-slate-700">{role}</div>
      {/* Space for wet signature */}
      <div className="h-16 sm:h-20" />
      <div className="font-semibold underline underline-offset-4">
        {name || "—"}
      </div>
      {nip ? (
        <div className="text-[11px]">
          NIP. <span className="font-mono">{nip}</span>
        </div>
      ) : phone ? (
        <div className="text-[11px]">
          HP. <span className="font-mono">{phone}</span>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// List item sub-components
// ============================================================

function TransactionListItem({
  tx,
  active,
  onSelect,
}: {
  tx: Transaction;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40",
        active
          ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 ring-1 ring-rose-500"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50/40 dark:hover:bg-rose-950/10",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {tx.noBku && (
            <Badge
              variant="outline"
              className="font-mono text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Hash className="size-2.5 mr-0.5" />
              {tx.noBku}
            </Badge>
          )}
          {tx.bulan && (
            <span className="text-[10px] text-slate-500">
              {getMonthName(tx.bulan).slice(0, 3)}
            </span>
          )}
        </div>
        <StatusBadge status={tx.status} />
      </div>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-1">
        {tx.uraian}
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1 text-[11px] text-slate-500 min-w-0">
          <Store className="size-3 shrink-0" />
          <span className="truncate">
            {tx.vendor?.name ?? "Tanpa vendor"}
          </span>
        </div>
        <div className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums shrink-0">
          {formatRupiah(tx.jumlah)}
        </div>
      </div>
    </button>
  );
}

// Compact chip used in the horizontal mobile strip
function TransactionChip({
  tx,
  active,
  onSelect,
}: {
  tx: Transaction;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "shrink-0 w-56 text-left rounded-lg border px-3 py-2 transition-colors",
        active
          ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20 ring-1 ring-rose-500"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
      ].join(" ")}
    >
      <div className="flex items-center gap-1.5 mb-1">
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
      <div className="text-xs font-medium text-slate-800 dark:text-slate-100 line-clamp-1">
        {tx.uraian}
      </div>
      <div className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
        {formatRupiah(tx.jumlah)}
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isLunas = status === "lunas";
  return (
    <Badge
      variant="outline"
      className={
        "text-[10px] " +
        (isLunas
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300")
      }
    >
      {isLunas ? "Lunas" : "Pending"}
    </Badge>
  );
}

// ============================================================
// Print CSS
// ============================================================

const PRINT_CSS = `
@media print {
  /* Hide every descendant of body... */
  body * {
    visibility: hidden;
  }
  /* ...but the print container and its descendants. */
  #spj-document-print,
  #spj-document-print * {
    visibility: visible;
  }
  /* Position the print container at the top-left of the page. */
  #spj-document-print {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  /* A4 page setup */
  @page {
    size: A4 portrait;
    margin: 1.2cm;
  }
  /* Ensure the document prints with dark text on white background */
  #spj-document-print,
  #spj-document-print * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  #spj-document-print table thead tr,
  #spj-document-print table tbody tr.total-row {
    background: #e5e7eb !important;
  }
  /* Avoid breaking inside signature blocks */
  #spj-document-print .signature-block {
    break-inside: avoid;
  }
}
`.trim();
