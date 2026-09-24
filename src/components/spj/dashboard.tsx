"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  FileStack,
  FileText,
  Loader2,
  Package,
  Receipt,
  Sparkles,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-spj";
import { formatNumber, formatRupiah, getMonthShort } from "@/lib/format";

// Format Y-axis ticks: compact IDR (millions / billions)
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

const toneMap: Record<
  Tone,
  { iconBg: string; iconText: string; ring: string }
> = {
  rose: {
    iconBg: "bg-rose-50 dark:bg-rose-950/40",
    iconText: "text-rose-700 dark:text-rose-300",
    ring: "border-rose-200 dark:border-rose-900",
  },
  violet: {
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    iconText: "text-violet-700 dark:text-violet-300",
    ring: "border-violet-200 dark:border-violet-900",
  },
  amber: {
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconText: "text-amber-700 dark:text-amber-300",
    ring: "border-amber-200 dark:border-amber-900",
  },
  emerald: {
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconText: "text-emerald-700 dark:text-emerald-300",
    ring: "border-emerald-200 dark:border-emerald-900",
  },
  cyan: {
    iconBg: "bg-cyan-50 dark:bg-cyan-950/40",
    iconText: "text-cyan-700 dark:text-cyan-300",
    ring: "border-cyan-200 dark:border-cyan-900",
  },
};

export function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <p className="text-sm text-muted-foreground">
          Memuat data dashboard SPJ...
        </p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center justify-center py-24 gap-3 border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900">
        <AlertCircle className="h-8 w-8 text-rose-600" />
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
          Gagal memuat dashboard
        </p>
        <p className="text-xs text-muted-foreground max-w-md text-center">
          {error?.message ?? "Terjadi kesalahan tak terduga"}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition-colors"
        >
          <Loader2 className="h-3 w-3" />
          Coba lagi
        </button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Tidak ada data tersedia</p>
      </Card>
    );
  }

  const { school, stats, monthly, byVendor } = data;

  // Build full 12-month array (fill missing months with zero)
  const monthMap = new Map(monthly.map((m) => [m.month, m]));
  const fullMonthly = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const entry = monthMap.get(monthNum);
    return {
      month: monthNum,
      label: getMonthShort(monthNum),
      total: entry?.total ?? 0,
      count: entry?.count ?? 0,
    };
  });

  // Status progress (lunas percentage of total)
  const lunasPct =
    stats.statusBreakdown.total > 0
      ? (stats.statusBreakdown.lunas / stats.statusBreakdown.total) * 100
      : 0;

  // Vendor breakdown percentages
  const vendorGrandTotal = byVendor.reduce((sum, v) => sum + v.total, 0);
  const vendorMax = byVendor.length > 0 ? byVendor[0].total : 0;
  const topVendors = byVendor.slice(0, 8);

  const schoolName = school?.name ?? "SMA NEGERI 1 TELUKDALAM";
  const schoolYear = school?.year ?? 2025;

  return (
    <div className="space-y-6">
      {/* ===== Hero header ===== */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900 text-white shadow-lg">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-rose-500/90 hover:bg-rose-500/90 text-white border-0">
                  <Building2 className="h-3 w-3 mr-1" />
                  {schoolName}
                </Badge>
                <Badge className="bg-amber-500/90 hover:bg-amber-500/90 text-white border-0">
                  <Calendar className="h-3 w-3 mr-1" />
                  Tahun {schoolYear}
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Dashboard SPJ
                </h1>
                <p className="text-base sm:text-lg text-rose-100 mt-0.5 font-medium">
                  Surat Pertanggungjawaban
                </p>
                <p className="text-sm text-slate-300 mt-1.5">
                  Sistem Pertanggungjawaban Pengadaan ATK Tahun {schoolYear}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3">
              <Sparkles className="h-5 w-5 text-amber-300 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-slate-300">
                  Total Realisasi
                </div>
                <div className="text-base sm:text-lg font-bold font-mono truncate">
                  {formatRupiah(stats.totalRealisasi)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Stat tiles ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
        <StatTile
          icon={<Wallet className="h-4 w-4" />}
          label="Total Pengeluaran"
          value={formatRupiah(stats.totalAmount)}
          tone="rose"
        />
        <StatTile
          icon={<Receipt className="h-4 w-4" />}
          label="Jumlah Transaksi"
          value={formatNumber(stats.transactionCount)}
          tone="violet"
        />
        <StatTile
          icon={<Store className="h-4 w-4" />}
          label="Jumlah Vendor"
          value={formatNumber(stats.vendorCount)}
          tone="amber"
        />
        <StatTile
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Status (Lunas / Pending)"
          value={`${stats.statusBreakdown.lunas} / ${stats.statusBreakdown.pending}`}
          tone="emerald"
          footer={
            <div className="mt-2 space-y-1">
              <Progress
                value={lunasPct}
                className="h-1.5 bg-emerald-100 dark:bg-emerald-950/60"
              />
              <div className="text-[10px] text-muted-foreground">
                {lunasPct.toFixed(1)}% lunas dari{" "}
                {stats.statusBreakdown.total} transaksi
              </div>
            </div>
          }
        />
      </div>

      {/* ===== Charts row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
        {/* Monthly spending chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-600" />
              Pengeluaran Bulanan
            </CardTitle>
            <CardDescription className="text-xs">
              Total pengadaan ATK per bulan sepanjang tahun {schoolYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                    "Pengeluaran",
                  ]}
                  labelFormatter={(label) => `Bulan ${label}`}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {fullMonthly.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={entry.total > 0 ? "#f43f5e" : "#fecdd3"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendor breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-violet-600" />
              Top Vendor
            </CardTitle>
            <CardDescription className="text-xs">
              {topVendors.length} vendor dengan nilai transaksi terbesar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topVendors.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-12">
                Belum ada data vendor
              </div>
            ) : (
              topVendors.map((v, i) => {
                const pctOfGrand =
                  vendorGrandTotal > 0
                    ? (v.total / vendorGrandTotal) * 100
                    : 0;
                const barWidth =
                  vendorMax > 0 ? (v.total / vendorMax) * 100 : 0;
                return (
                  <div
                    key={v.vendorId}
                    className="group rounded-md border bg-card p-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-muted-foreground font-mono w-4 flex-shrink-0">
                          #{i + 1}
                        </span>
                        <span className="text-xs font-medium truncate">
                          {v.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-violet-700 dark:text-violet-300 font-mono">
                          {formatRupiah(v.total)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {pctOfGrand.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-violet-100 dark:bg-violet-950/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== Quick stats row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
        <QuickStat
          icon={<Package className="h-4 w-4" />}
          label="Total Produk"
          value={formatNumber(stats.productCount)}
          tone="cyan"
        />
        <QuickStat
          icon={<FileStack className="h-4 w-4" />}
          label="Total BPU"
          value={formatNumber(stats.bpuCount)}
          tone="amber"
        />
        <QuickStat
          icon={<FileText className="h-4 w-4" />}
          label="Total Dokumen"
          value={formatNumber(stats.documentCount)}
          tone="violet"
        />
        <QuickStat
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Realisasi"
          value={formatRupiah(stats.totalRealisasi)}
          tone="emerald"
        />
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function StatTile({
  icon,
  label,
  value,
  tone,
  footer,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
  footer?: React.ReactNode;
}) {
  const t = toneMap[tone];
  return (
    <Card
      className={`gap-0 py-0 border h-full flex flex-col ${t.ring} hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-4 space-y-3 flex flex-col flex-1">
        <div
          className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${t.iconBg} ${t.iconText}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </div>
          <div className="text-lg sm:text-xl font-bold mt-0.5 truncate">
            {value}
          </div>
          {footer}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
}) {
  const t = toneMap[tone];
  return (
    <Card
      className={`gap-0 py-0 border h-full flex flex-col ${t.ring} hover:shadow-sm transition-shadow`}
    >
      <CardContent className="p-3 flex items-center gap-3 flex-1">
        <div
          className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${t.iconBg} ${t.iconText} flex-shrink-0`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </div>
          <div className="text-sm sm:text-base font-bold truncate">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
