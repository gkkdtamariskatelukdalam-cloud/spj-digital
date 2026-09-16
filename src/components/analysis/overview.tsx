"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileSpreadsheet,
  Lock,
  Unlock,
  Code2,
  FunctionSquare,
  Hash,
  Building2,
  Calendar,
  FileText,
  Layers,
  TrendingUp,
  Boxes,
  Sparkles,
} from "lucide-react";
import type { Summary } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

interface OverviewProps {
  summary: Summary;
  onSheetClick: (name: string) => void;
  onVbaClick: () => void;
}

export function Overview({ summary, onSheetClick, onVbaClick }: OverviewProps) {
  const { file_info: info, sheets, vba_modules } = summary;

  // Category breakdown
  const byCategory = sheets.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, string> = {
    form: "Print Forms",
    data: "Master Data",
    reference: "Reference",
    helper: "Helper",
    info: "Info",
    log: "Log",
    other: "Other",
  };

  const categoryColors: Record<string, string> = {
    form: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40",
    data: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40",
    reference: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40",
    helper: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40",
    info: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40",
    log: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40",
    other: "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40",
  };

  const topSheetsByFormulas = [...sheets]
    .sort((a, b) => b.formulas_count - a.formulas_count)
    .slice(0, 6);

  const nonEmptyVba = vba_modules.filter((m) => !m.is_empty);

  return (
    <div className="space-y-4">
      {/* Hero header */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 text-white">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-white/20 hover:bg-white/20 text-white border-0">
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Excel Macro-Enabled
                </Badge>
                <Badge className="bg-rose-500/90 hover:bg-rose-500/90 text-white border-0">
                  <Lock className="h-3 w-3 mr-1" />
                  Password Protected
                </Badge>
                <Badge className="bg-emerald-500/90 hover:bg-emerald-500/90 text-white border-0">
                  <Unlock className="h-3 w-3 mr-1" />
                  Decrypted: {info.password}
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {info.name}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 mt-1">
                  {info.purpose}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {info.organization}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Tahun {info.year}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
              <StatTile
                icon={<Layers className="h-4 w-4" />}
                label="Sheets"
                value={info.sheets_count}
              />
              <StatTile
                icon={<Code2 className="h-4 w-4" />}
                label="VBA Modules"
                value={info.vba_modules_count}
              />
              <StatTile
                icon={<FunctionSquare className="h-4 w-4" />}
                label="Total Formulas"
                value={info.total_formulas}
              />
              <StatTile
                icon={<Hash className="h-4 w-4" />}
                label="Total Cells"
                value={info.total_cells}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(byCategory).map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => onSheetClick("")} // will switch to sheets tab
            className={cn(
              "rounded-md border p-3 text-left transition-all hover:scale-[1.02]",
              categoryColors[cat] || categoryColors.other
            )}
          >
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-80">
              {categoryLabels[cat] || cat}
            </div>
            <div className="text-xl font-bold font-mono mt-1">{count}</div>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top sheets by formula count */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-600" />
              Sheet dengan Formula Terbanyak
            </CardTitle>
            <CardDescription className="text-xs">
              6 sheet dengan kepadatan rumus tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topSheetsByFormulas.map((s, i) => {
              const max = topSheetsByFormulas[0].formulas_count;
              const pct = max > 0 ? (s.formulas_count / max) * 100 : 0;
              return (
                <button
                  key={s.name}
                  onClick={() => onSheetClick(s.name)}
                  className="w-full text-left hover:bg-muted/40 rounded-md p-2 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-bold text-muted-foreground w-4">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-medium truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
                      {s.formulas_count.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* VBA summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4 text-violet-600" />
              Ringkasan Macro VBA
            </CardTitle>
            <CardDescription className="text-xs">
              {nonEmptyVba.length} modul aktif dari {vba_modules.length} total modul
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border bg-violet-50 dark:bg-violet-950/40 p-2">
                <div className="text-lg font-bold text-violet-700 dark:text-violet-300">
                  {nonEmptyVba.length}
                </div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  Aktif
                </div>
              </div>
              <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/40 p-2">
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {vba_modules.filter((m) => m.code_length > 0 && m.purpose.includes("HideEmptyRows")).length}
                </div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  Hide Rows
                </div>
              </div>
              <div className="rounded-md border bg-rose-50 dark:bg-rose-950/40 p-2">
                <div className="text-lg font-bold text-rose-700 dark:text-rose-300">
                  {vba_modules.filter((m) => m.purpose.includes("SavePDF")).length}
                </div>
                <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
                  SavePDF
                </div>
              </div>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pt-2">
              {nonEmptyVba.map((m) => (
                <button
                  key={m.name}
                  onClick={onVbaClick}
                  className="w-full text-left rounded-md border bg-card p-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-semibold text-violet-700 dark:text-violet-300 truncate">
                      {m.name}
                    </code>
                    <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                      {m.code_length}c
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {m.purpose}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document workflow info */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Alur Dokumen Pengadaan ATK
          </CardTitle>
          <CardDescription className="text-xs">
            Sistem ini mengelola alur pengadaan ATK sekolah dengan dokumen-dokumen berurutan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <WorkflowStep
              num="01"
              title="01PESAN"
              desc="Surat Pesanan"
              detail="Order Letter"
              onClick={() => onSheetClick("01PESAN")}
            />
            <WorkflowStep
              num="02"
              title="02BANDING"
              desc="Pembanding"
              detail="Comparison Doc"
              onClick={() => onSheetClick("02BANDING")}
            />
            <WorkflowStep
              num="03"
              title="03RENCANA"
              desc="Rencana"
              detail="Plan Document"
              onClick={() => onSheetClick("03RENCANA")}
            />
            <WorkflowStep
              num="04"
              title="04SHP"
              desc="Hasil Pembanding"
              detail="Comparison Result"
              onClick={() => onSheetClick("04SHP")}
            />
            <WorkflowStep
              num="05"
              title="05BAT"
              desc="Berita Acara"
              detail="Inspection Report"
              onClick={() => onSheetClick("05BAT")}
            />
            <WorkflowStep
              num="06"
              title="Toko"
              desc="Vendor"
              detail="Vendor Invoice"
              onClick={() => onSheetClick("Toko")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-2.5">
      <div className="flex items-center gap-1 text-slate-300 mb-0.5">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg sm:text-xl font-bold font-mono">{value.toLocaleString()}</div>
    </div>
  );
}

function WorkflowStep({
  num,
  title,
  desc,
  detail,
  onClick,
}: {
  num: string;
  title: string;
  desc: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-md border bg-card p-3 hover:shadow-sm hover:border-rose-300 transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-300">
          {num}
        </span>
        <Boxes className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="text-sm font-bold truncate">{title}</div>
      <div className="text-[11px] text-muted-foreground">{desc}</div>
      <div className="text-[10px] text-muted-foreground/70 italic mt-0.5">{detail}</div>
    </button>
  );
}
