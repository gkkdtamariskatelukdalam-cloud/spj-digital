"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  PieChart as PieChartIcon,
  Store,
  Tags,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useReport } from "@/hooks/use-spj";
import {
  formatNumber,
  formatRupiah,
  getMonthName,
  getMonthShort,
} from "@/lib/format";

// ============================================================
// Color palette — NO indigo/blue
// ============================================================
const COLOR = {
  rose: "#f43f5e",
  roseLight: "#fecdd3",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  emerald: "#10b981",
  cyan: "#06b6d4",
  slate: "#64748b",
} as const;

// Per-category color mapping (Konsumsi=amber, Jasa=cyan, ATK=violet, Lainnya=slate)
const CATEGORY_COLORS: Record<string, string> = {
  Konsumsi: COLOR.amber,
  Jasa: COLOR.cyan,
  ATK: COLOR.violet,
  Lainnya: COLOR.slate,
};

// Vendor pie palette: violet / rose / emerald / amber / cyan
const VENDOR_PALETTE = [
  COLOR.violet,
  COLOR.rose,
  COLOR.emerald,
  COLOR.amber,
  COLOR.cyan,
];

// ============================================================
// Type definitions for the actual API response shapes
// (see /api/spj/reports/route.ts)
// ============================================================
interface MonthlyRow {
  month: number;
  monthName: string;
  total: number;
  count: number;
}

interface VendorRow {
  vendorId: string;
  name: string;
  owner: string | null;
  phone: string | null;
  total: number;
  count: number;
}

interface VendorReportData {
  byVendor: VendorRow[];
  noVendor: { total: number; count: number };
  totalVendors: number;
}

interface CategoryRow {
  category: string;
  total: number;
  count: number;
}

interface StatusReportData {
  lunas: { count: number; amount: number };
  pending: { count: number; amount: number };
  total: { count: number; amount: number };
}

// ============================================================
// Helpers
// ============================================================

// Compact IDR formatter for axis ticks (millions / billions / thousands)
function formatMillions(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${amount}`;
}

type Tone = "rose" | "violet" | "amber" | "emerald" | "cyan";

const toneStyles: Record<
  Tone,
  { ring: string; bg: string; text: string; bar: string }
> = {
  rose: {
    ring: "border-rose-200 dark:border-rose-900",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    bar: COLOR.rose,
  },
  violet: {
    ring: "border-violet-200 dark:border-violet-900",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    bar: COLOR.violet,
  },
  amber: {
    ring: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    bar: COLOR.amber,
  },
  emerald: {
    ring: "border-emerald-200 dark:border-emerald-900",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    bar: COLOR.emerald,
  },
  cyan: {
    ring: "border-cyan-200 dark:border-cyan-900",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    bar: COLOR.cyan,
  },
};

// ============================================================
// Shared state components
// ============================================================

function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-24 gap-3 border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900">
      <AlertCircle className="h-8 w-8 text-rose-600" />
      <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
        Gagal memuat laporan
      </p>
      <p className="text-xs text-muted-foreground max-w-md text-center">
        {message ?? "Terjadi kesalahan tak terduga"}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition-colors"
        >
          <Loader2 className="h-3 w-3" />
          Coba lagi
        </button>
      )}
    </Card>
  );
}

function EmptyCard({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-24 gap-3 border-dashed">
      <AlertCircle className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          {description}
        </p>
      )}
    </Card>
  );
}

// Compact inline progress bar with explicit color
function ProgressBar({
  value,
  color,
  className,
}: {
  value: number;
  color: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2 w-full rounded-full bg-muted overflow-hidden ${className ?? ""}`}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Small stat tile used in summary rows
function SmallStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  const t = toneStyles[tone];
  return (
    <Card className={`gap-0 py-0 ${t.ring}`}>
      <CardContent className="p-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </div>
        <div className="text-sm sm:text-base font-bold truncate">{value}</div>
      </CardContent>
    </Card>
  );
}

// Larger stat tile used in Status SPJ tab
function StatusStat({
  icon,
  label,
  count,
  amount,
  tone,
  progress,
  progressLabel,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  amount: number;
  tone: Tone;
  progress: number;
  progressLabel: string;
}) {
  const t = toneStyles[tone];
  return (
    <Card className={`gap-0 py-0 ${t.ring} overflow-hidden`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${t.bg} ${t.text}`}
          >
            {icon}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="space-y-1">
          <div className="text-xl font-bold">
            {formatNumber(count)}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              transaksi
            </span>
          </div>
          <div className={`text-sm font-mono ${t.text}`}>
            {formatRupiah(amount)}
          </div>
        </div>
        <div className="space-y-1">
          <ProgressBar value={progress} color={t.bar} />
          <div className="text-[10px] text-muted-foreground">
            {progressLabel}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Reports component
// ============================================================

export function Reports() {
  const [tab, setTab] = useState("monthly");

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <TabsList className="bg-muted/60 h-auto py-1 gap-1">
          <TabsTrigger
            value="monthly"
            className="data-[state=active]:bg-rose-600 data-[state=active]:text-white gap-1.5"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Rekap Bulanan
          </TabsTrigger>
          <TabsTrigger
            value="vendor"
            className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-1.5"
          >
            <Store className="h-3.5 w-3.5" />
            Per Vendor
          </TabsTrigger>
          <TabsTrigger
            value="category"
            className="data-[state=active]:bg-amber-600 data-[state=active]:text-white gap-1.5"
          >
            <Tags className="h-3.5 w-3.5" />
            Per Kategori
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white gap-1.5"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Status SPJ
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="monthly">
        <MonthlyReport />
      </TabsContent>
      <TabsContent value="vendor">
        <VendorReport />
      </TabsContent>
      <TabsContent value="category">
        <CategoryReport />
      </TabsContent>
      <TabsContent value="status">
        <StatusReport />
      </TabsContent>
    </Tabs>
  );
}

// ============================================================
// Tab 1: Rekap Bulanan
// ============================================================

function MonthlyReport() {
  const { data, isLoading, isError, error, refetch } = useReport("monthly");

  if (isLoading) return <LoadingCard label="Memuat rekap bulanan..." />;
  if (isError)
    return <ErrorCard message={error?.message} onRetry={() => refetch()} />;
  if (!data || !Array.isArray(data.data))
    return (
      <EmptyCard
        title="Belum ada data bulanan"
        description="Data transaksi bulanan akan muncul di sini setelah ada transaksi yang dicatat."
      />
    );

  const rows = data.data as MonthlyRow[];
  if (rows.length === 0)
    return (
      <EmptyCard
        title="Belum ada data bulanan"
        description="Data transaksi bulanan akan muncul di sini setelah ada transaksi yang dicatat."
      />
    );

  // Build full 12-month array (fill missing months with zero so axis is consistent)
  const monthMap = new Map(rows.map((r) => [r.month, r]));
  const fullMonthly = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const entry = monthMap.get(monthNum);
    return {
      month: monthNum,
      label: getMonthShort(monthNum),
      monthName: entry?.monthName ?? getMonthName(monthNum),
      total: entry?.total ?? 0,
      count: entry?.count ?? 0,
    };
  });

  const grandTotal = rows.reduce((s, r) => s + (r.total || 0), 0);
  const grandCount = rows.reduce((s, r) => s + (r.count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SmallStat
          label="Total Bulan Aktif"
          value={formatNumber(rows.length)}
          tone="rose"
        />
        <SmallStat
          label="Total Transaksi"
          value={formatNumber(grandCount)}
          tone="violet"
        />
        <SmallStat
          label="Total Nilai"
          value={formatRupiah(grandTotal)}
          tone="emerald"
        />
        <SmallStat
          label="Rata-rata / Bulan"
          value={formatRupiah(rows.length > 0 ? grandTotal / rows.length : 0)}
          tone="amber"
        />
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-600" />
            Pengeluaran per Bulan
          </CardTitle>
          <CardDescription className="text-xs">
            Total nilai pengadaan ATK per bulan sepanjang tahun anggaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={fullMonthly}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
                opacity={0.6}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => formatMillions(Number(v))}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                cursor={{ fill: "rgba(244,63,94,0.06)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [
                  formatRupiah(Number(value)),
                  "Total Nilai",
                ]}
                labelFormatter={(label) => {
                  const found = fullMonthly.find((m) => m.label === label);
                  return found ? `Bulan ${found.monthName}` : `Bulan ${label}`;
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {fullMonthly.map((entry) => (
                  <Cell
                    key={entry.month}
                    fill={entry.total > 0 ? COLOR.rose : COLOR.roseLight}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data table with sticky header + footer */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-rose-600" />
            Tabel Rekap Bulanan
          </CardTitle>
          <CardDescription className="text-xs">
            Rincian transaksi, total nilai, dan realisasi per bulan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[420px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 min-w-[140px]">Bulan</TableHead>
                  <TableHead className="text-right">Jumlah Transaksi</TableHead>
                  <TableHead className="text-right">Total Nilai (Rp)</TableHead>
                  <TableHead className="text-right pr-4">
                    Total Realisasi (Rp)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fullMonthly.map((m) => (
                  <TableRow
                    key={m.month}
                    className={m.count === 0 ? "opacity-50" : ""}
                  >
                    <TableCell className="pl-4 font-medium">
                      {m.monthName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(m.count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono text-rose-700 dark:text-rose-300">
                      {formatRupiah(m.total)}
                    </TableCell>
                    <TableCell className="text-right pr-4 text-muted-foreground">
                      —
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="sticky bottom-0 z-10 bg-muted/80 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent font-bold">
                  <TableCell className="pl-4">TOTAL</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(grandCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-rose-700 dark:text-rose-300">
                    {formatRupiah(grandTotal)}
                  </TableCell>
                  <TableCell className="text-right pr-4 text-muted-foreground">
                    —
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
          <p className="px-4 py-2 text-[10px] text-muted-foreground border-t">
            * Total Realisasi belum tersedia di agregasi bulanan (API
            <span className="font-mono"> /api/spj/reports?type=monthly</span>{" "}
            hanya mengembalikan total nilai &amp; jumlah transaksi)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Tab 2: Per Vendor
// ============================================================

function VendorReport() {
  const { data, isLoading, isError, error, refetch } = useReport("vendor");

  if (isLoading) return <LoadingCard label="Memuat laporan vendor..." />;
  if (isError)
    return <ErrorCard message={error?.message} onRetry={() => refetch()} />;
  if (!data)
    return (
      <EmptyCard
        title="Belum ada data vendor"
        description="Laporan per vendor akan muncul di sini."
      />
    );

  const payload = data.data as VendorReportData;
  if (
    !payload ||
    !Array.isArray(payload.byVendor) ||
    payload.byVendor.length === 0
  )
    return (
      <EmptyCard
        title="Belum ada data vendor"
        description="Laporan per vendor akan muncul setelah transaksi dengan vendor tercatat."
      />
    );

  const byVendor = payload.byVendor;
  const noVendor = payload.noVendor ?? { total: 0, count: 0 };

  // Grand total = sum of all vendors + the noVendor bucket
  const grandTotal =
    byVendor.reduce((s, v) => s + (v.total || 0), 0) +
    (noVendor.total || 0);
  const grandCount =
    byVendor.reduce((s, v) => s + (v.count || 0), 0) +
    (noVendor.count || 0);

  // Pie data: top 5 vendors + "Lainnya" bucket (rest + noVendor)
  const topVendors = byVendor.slice(0, 5);
  const restTotal =
    byVendor.slice(5).reduce((s, v) => s + (v.total || 0), 0) +
    (noVendor.total || 0);
  const pieData = [
    ...topVendors.map((v, i) => ({
      name: v.name,
      value: v.total,
      color: VENDOR_PALETTE[i % VENDOR_PALETTE.length],
    })),
    ...(restTotal > 0
      ? [{ name: "Lainnya", value: restTotal, color: COLOR.slate }]
      : []),
  ];

  // Horizontal bar data — top 10 vendors
  const barData = byVendor.slice(0, 10).map((v, i) => ({
    name: v.name,
    total: v.total,
    color: VENDOR_PALETTE[i % VENDOR_PALETTE.length],
  }));

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SmallStat
          label="Total Vendor"
          value={formatNumber(payload.totalVendors ?? byVendor.length)}
          tone="violet"
        />
        <SmallStat
          label="Total Transaksi"
          value={formatNumber(grandCount)}
          tone="rose"
        />
        <SmallStat
          label="Total Nilai"
          value={formatRupiah(grandTotal)}
          tone="emerald"
        />
        <SmallStat
          label="Tanpa Vendor"
          value={formatNumber(noVendor.count || 0)}
          tone="amber"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Horizontal bar chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-violet-600" />
              Top 10 Vendor
            </CardTitle>
            <CardDescription className="text-xs">
              Vendor dengan total nilai transaksi terbesar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                layout="vertical"
                data={barData}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  horizontal={false}
                  opacity={0.6}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => formatMillions(Number(v))}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) =>
                    v.length > 16 ? `${v.slice(0, 16)}…` : v
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(139,92,246,0.06)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    formatRupiah(Number(value)),
                    "Total Nilai",
                  ]}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-rose-600" />
              Distribusi Vendor
            </CardTitle>
            <CardDescription className="text-xs">
              Pangsa nilai transaksi top 5 + lainnya
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const pct =
                      grandTotal > 0 ? (Number(value) / grandTotal) * 100 : 0;
                    return [
                      `${formatRupiah(Number(value))} (${pct.toFixed(1)}%)`,
                      String(name),
                    ];
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-violet-600" />
            Tabel Vendor
          </CardTitle>
          <CardDescription className="text-xs">
            Rincian transaksi dan nilai per vendor
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[480px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 min-w-[60px]">#</TableHead>
                  <TableHead className="min-w-[180px]">Vendor</TableHead>
                  <TableHead className="min-w-[140px]">Pemilik</TableHead>
                  <TableHead className="text-right">Jumlah Transaksi</TableHead>
                  <TableHead className="text-right">Total Nilai (Rp)</TableHead>
                  <TableHead className="text-right pr-4">% dari Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byVendor.map((v, i) => {
                  const pct =
                    grandTotal > 0 ? (v.total / grandTotal) * 100 : 0;
                  const color = VENDOR_PALETTE[i % VENDOR_PALETTE.length];
                  return (
                    <TableRow key={v.vendorId}>
                      <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate">{v.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {v.owner ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(v.count)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-mono text-violet-700 dark:text-violet-300">
                        {formatRupiah(v.total)}
                      </TableCell>
                      <TableCell className="text-right pr-4 tabular-nums">
                        <div className="inline-flex items-center gap-2">
                          <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {noVendor.count > 0 && (
                  <TableRow className="italic text-muted-foreground border-t-2 border-dashed">
                    <TableCell className="pl-4 font-mono text-xs">—</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: COLOR.slate }}
                        />
                        <span>Tanpa Vendor</span>
                      </div>
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(noVendor.count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-mono">
                      {formatRupiah(noVendor.total)}
                    </TableCell>
                    <TableCell className="text-right pr-4 tabular-nums">
                      {grandTotal > 0
                        ? ((noVendor.total / grandTotal) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="sticky bottom-0 z-10 bg-muted/80 backdrop-blur-sm">
                <TableRow className="hover:bg-transparent font-bold">
                  <TableCell className="pl-4" colSpan={3}>
                    TOTAL (
                    {formatNumber(
                      payload.totalVendors ?? byVendor.length
                    )}{" "}
                    vendor)
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(grandCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-mono text-violet-700 dark:text-violet-300">
                    {formatRupiah(grandTotal)}
                  </TableCell>
                  <TableCell className="text-right pr-4 tabular-nums">
                    100.0%
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Tab 3: Per Kategori
// ============================================================

function CategoryReport() {
  const { data, isLoading, isError, error, refetch } = useReport("category");

  if (isLoading) return <LoadingCard label="Memuat laporan kategori..." />;
  if (isError)
    return <ErrorCard message={error?.message} onRetry={() => refetch()} />;
  if (!data || !Array.isArray(data.data))
    return (
      <EmptyCard
        title="Belum ada data kategori"
        description="Laporan per kategori akan muncul di sini."
      />
    );

  const rows = data.data as CategoryRow[];
  if (rows.length === 0)
    return (
      <EmptyCard
        title="Belum ada data kategori"
        description="Laporan per kategori akan muncul setelah transaksi tercatat."
      />
    );

  const grandTotal = rows.reduce((s, r) => s + (r.total || 0), 0);
  const grandCount = rows.reduce((s, r) => s + (r.count || 0), 0);

  const pieData = rows.map((r) => ({
    name: r.category,
    value: r.total,
    count: r.count,
    color: CATEGORY_COLORS[r.category] ?? COLOR.slate,
  }));

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SmallStat
          label="Total Kategori"
          value={formatNumber(rows.length)}
          tone="amber"
        />
        <SmallStat
          label="Total Transaksi"
          value={formatNumber(grandCount)}
          tone="rose"
        />
        <SmallStat
          label="Total Nilai"
          value={formatRupiah(grandTotal)}
          tone="emerald"
        />
        <SmallStat
          label="Rata-rata / Transaksi"
          value={formatRupiah(grandCount > 0 ? grandTotal / grandCount : 0)}
          tone="violet"
        />
      </div>

      {/* Pie chart + legend cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-amber-600" />
              Distribusi Kategori
            </CardTitle>
            <CardDescription className="text-xs">
              Pangsa nilai pengeluaran per kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const pct =
                      grandTotal > 0 ? (Number(value) / grandTotal) * 100 : 0;
                    return [
                      `${formatRupiah(Number(value))} (${pct.toFixed(1)}%)`,
                      String(name),
                    ];
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Per-category summary cards with progress bars */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tags className="h-4 w-4 text-amber-600" />
              Ringkasan Kategori
            </CardTitle>
            <CardDescription className="text-xs">
              Total nilai, transaksi, dan pangsa per kategori
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pieData.map((c) => {
              const pct = grandTotal > 0 ? (c.value / grandTotal) * 100 : 0;
              return (
                <div
                  key={c.name}
                  className="group rounded-md border bg-card p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-sm font-medium truncate">
                        {c.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {formatNumber(c.count)} transaksi
                      </Badge>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div
                        className="text-sm font-bold font-mono"
                        style={{ color: c.color }}
                      >
                        {formatRupiah(c.value)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <ProgressBar value={pct} color={c.color} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Data table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-4 w-4 text-amber-600" />
            Tabel Kategori
          </CardTitle>
          <CardDescription className="text-xs">
            Rincian nilai dan transaksi per kategori pengadaan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 min-w-[160px]">Kategori</TableHead>
                <TableHead className="text-right">Jumlah Transaksi</TableHead>
                <TableHead className="text-right">Total Nilai (Rp)</TableHead>
                <TableHead className="text-right pr-4">% dari Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const color = CATEGORY_COLORS[r.category] ?? COLOR.slate;
                const pct = grandTotal > 0 ? (r.total / grandTotal) * 100 : 0;
                return (
                  <TableRow key={r.category}>
                    <TableCell className="pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {r.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(r.count)}
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums font-mono"
                      style={{ color }}
                    >
                      {formatRupiah(r.total)}
                    </TableCell>
                    <TableCell className="text-right pr-4 tabular-nums">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter className="bg-muted/80">
              <TableRow className="hover:bg-transparent font-bold">
                <TableCell className="pl-4">TOTAL</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(grandCount)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-mono text-amber-700 dark:text-amber-300">
                  {formatRupiah(grandTotal)}
                </TableCell>
                <TableCell className="text-right pr-4 tabular-nums">
                  100.0%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Tab 4: Status SPJ
// ============================================================

function StatusReport() {
  const { data, isLoading, isError, error, refetch } = useReport("status");

  if (isLoading) return <LoadingCard label="Memuat laporan status..." />;
  if (isError)
    return <ErrorCard message={error?.message} onRetry={() => refetch()} />;
  if (!data)
    return (
      <EmptyCard
        title="Belum ada data status"
        description="Laporan status SPJ akan muncul di sini."
      />
    );

  const payload = data.data as StatusReportData;
  if (!payload || !payload.lunas || !payload.pending || !payload.total)
    return (
      <EmptyCard
        title="Belum ada data status"
        description="Laporan status SPJ akan muncul setelah transaksi tercatat."
      />
    );

  const lunas = payload.lunas;
  const pending = payload.pending;
  const total = payload.total;

  const lunasCountPct =
    total.count > 0 ? (lunas.count / total.count) * 100 : 0;
  const pendingCountPct =
    total.count > 0 ? (pending.count / total.count) * 100 : 0;
  const lunasAmountPct =
    total.amount > 0 ? (lunas.amount / total.amount) * 100 : 0;
  const pendingAmountPct =
    total.amount > 0 ? (pending.amount / total.amount) * 100 : 0;

  const countData = [
    { name: "Lunas", value: lunas.count, color: COLOR.emerald },
    { name: "Pending", value: pending.count, color: COLOR.amber },
  ];
  const amountData = [
    { name: "Lunas", value: lunas.amount, color: COLOR.emerald },
    { name: "Pending", value: pending.amount, color: COLOR.amber },
  ];

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatusStat
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Total Lunas"
          count={lunas.count}
          amount={lunas.amount}
          tone="emerald"
          progress={lunasCountPct}
          progressLabel={`${lunasCountPct.toFixed(1)}% dari ${formatNumber(
            total.count
          )} transaksi`}
        />
        <StatusStat
          icon={<Clock className="h-5 w-5" />}
          label="Total Pending"
          count={pending.count}
          amount={pending.amount}
          tone="amber"
          progress={pendingCountPct}
          progressLabel={`${pendingCountPct.toFixed(1)}% dari ${formatNumber(
            total.count
          )} transaksi`}
        />
        <StatusStat
          icon={<ClipboardList className="h-5 w-5" />}
          label="Total Semua"
          count={total.count}
          amount={total.amount}
          tone="rose"
          progress={100}
          progressLabel="100% dari seluruh transaksi"
        />
      </div>

      {/* Donut charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut: count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-emerald-600" />
              Status Berdasarkan Jumlah Transaksi
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi jumlah transaksi lunas vs pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={countData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  stroke="none"
                >
                  {countData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const pct =
                      total.count > 0
                        ? (Number(value) / total.count) * 100
                        : 0;
                    return [
                      `${formatNumber(Number(value))} transaksi (${pct.toFixed(
                        1
                      )}%)`,
                      String(name),
                    ];
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLOR.emerald }}
                    />
                    Lunas
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {lunas.count} ({lunasCountPct.toFixed(1)}%)
                  </span>
                </div>
                <ProgressBar value={lunasCountPct} color={COLOR.emerald} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLOR.amber }}
                    />
                    Pending
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {pending.count} ({pendingCountPct.toFixed(1)}%)
                  </span>
                </div>
                <ProgressBar value={pendingCountPct} color={COLOR.amber} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donut: amount */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-rose-600" />
              Status Berdasarkan Nilai (Rp)
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi nilai transaksi lunas vs pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={amountData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  stroke="none"
                >
                  {amountData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    const pct =
                      total.amount > 0
                        ? (Number(value) / total.amount) * 100
                        : 0;
                    return [
                      `${formatRupiah(Number(value))} (${pct.toFixed(1)}%)`,
                      String(name),
                    ];
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLOR.emerald }}
                    />
                    Lunas
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatRupiah(lunas.amount)} ({lunasAmountPct.toFixed(1)}%)
                  </span>
                </div>
                <ProgressBar value={lunasAmountPct} color={COLOR.emerald} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLOR.amber }}
                    />
                    Pending
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatRupiah(pending.amount)} (
                    {pendingAmountPct.toFixed(1)}%)
                  </span>
                </div>
                <ProgressBar value={pendingAmountPct} color={COLOR.amber} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
