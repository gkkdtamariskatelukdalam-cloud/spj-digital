"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Sigma,
  Database,
  Columns3,
  Hash,
  Search,
  FunctionSquare,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import type { SheetDetail } from "@/lib/types/analysis";
import { cn } from "@/lib/utils";

interface SheetDetailProps {
  sheet: SheetDetail;
}

export function SheetDetailView({ sheet }: SheetDetailProps) {
  const [search, setSearch] = useState("");

  const filteredFormulas = sheet.formulas.filter(
    (f) =>
      f.cell.toLowerCase().includes(search.toLowerCase()) ||
      f.formula.toLowerCase().includes(search.toLowerCase()) ||
      f.value.toLowerCase().includes(search.toLowerCase())
  );

  // Compute formula categories
  const arrayFormulas = sheet.formulas.filter((f) => f.type === "array");
  const normalFormulas = sheet.formulas.filter((f) => f.type === "normal");

  // Build sample rows matrix for the data preview
  const maxColInSample = sheet.sample_rows.reduce((acc, r) => {
    return Math.max(
      acc,
      ...r.cells.map((c) => c.col_idx)
    );
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="border-l-4 border-l-rose-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl">{sheet.name}</CardTitle>
                <Badge variant="secondary">{sheet.type}</Badge>
              </div>
              <CardDescription className="text-sm">
                {sheet.purpose}
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatBlock
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Rows"
                value={sheet.max_row}
              />
              <StatBlock
                icon={<Columns3 className="h-3.5 w-3.5" />}
                label="Cols"
                value={sheet.max_col}
              />
              <StatBlock
                icon={<FileSpreadsheet className="h-3.5 w-3.5" />}
                label="Cells"
                value={sheet.non_empty_cells}
              />
              <StatBlock
                icon={<FunctionSquare className="h-3.5 w-3.5" />}
                label="Formulas"
                value={sheet.formulas_count}
                accent
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="formulas" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="formulas" className="gap-1.5">
            <Sigma className="h-3.5 w-3.5" />
            Rumus & Formula
            <Badge variant="secondary" className="text-[10px] h-4">
              {sheet.formulas_count}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Pratinjau Data
          </TabsTrigger>
        </TabsList>

        {/* Formulas tab */}
        <TabsContent value="formulas" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sigma className="h-4 w-4 text-rose-600" />
                  Analisis Rumus Cell
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    <Hash className="h-2.5 w-2.5 mr-1" />
                    {normalFormulas.length} normal
                  </Badge>
                  {arrayFormulas.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-violet-400 text-violet-700 dark:text-violet-300"
                    >
                      <FunctionSquare className="h-2.5 w-2.5 mr-1" />
                      {arrayFormulas.length} array
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="text-xs">
                Menampilkan {filteredFormulas.length} dari {sheet.formulas_count.toLocaleString()} formula
                {sheet.formulas_count > 300 && " (maks 300 ditampilkan untuk performa)"}
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan cell, rumus, atau nilai..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-16 text-xs">Cell</TableHead>
                      <TableHead className="w-20 text-xs">Tipe</TableHead>
                      <TableHead className="text-xs">Rumus (Formula)</TableHead>
                      <TableHead className="w-56 text-xs">Nilai (Hasil)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormulas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                          {sheet.formulas_count === 0
                            ? "Sheet ini tidak memiliki formula"
                            : "Tidak ada formula yang cocok dengan pencarian"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFormulas.map((f, i) => (
                        <TableRow key={i} className="hover:bg-muted/40">
                          <TableCell className="font-mono font-semibold text-xs">
                            {f.cell}
                          </TableCell>
                          <TableCell>
                            {f.type === "array" ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-violet-400 text-violet-700 dark:text-violet-300 font-mono"
                              >
                                ARRAY
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-mono"
                              >
                                FORMULA
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded block whitespace-pre-wrap break-all leading-relaxed">
                              {f.formula}
                            </code>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "text-xs font-mono block truncate",
                                f.value ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground italic"
                              )}
                              title={f.value}
                            >
                              {f.value || "(kosong)"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data preview tab */}
        <TabsContent value="preview" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-600" />
                Pratinjau Data (15 baris pertama)
              </CardTitle>
              <CardDescription className="text-xs">
                Tampilan cell dengan formula + nilai yang sudah dihitung
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-12 text-xs sticky left-0 bg-card">#</TableHead>
                      {Array.from({ length: Math.min(maxColInSample, 15) }, (_, i) => (
                        <TableHead key={i} className="text-xs min-w-32">
                          Kolom {String.fromCharCode(65 + i)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sheet.sample_rows.map((row) => (
                      <TableRow key={row.row}>
                        <TableCell className="text-xs font-mono font-semibold text-muted-foreground sticky left-0 bg-card">
                          {row.row}
                        </TableCell>
                        {Array.from({ length: Math.min(maxColInSample, 15) }, (_, i) => {
                          const cell = row.cells.find((c) => c.col_idx === i + 1);
                          return (
                            <TableCell key={i} className="text-xs align-top min-w-32 max-w-64">
                              {cell ? (
                                <div className="space-y-1">
                                  {cell.is_formula && (
                                    <div className="flex items-center gap-1">
                                      {cell.is_array && (
                                        <Badge
                                          variant="outline"
                                          className="text-[8px] h-3 px-1 py-0 border-violet-400 text-violet-700 dark:text-violet-300"
                                        >
                                          ARR
                                        </Badge>
                                      )}
                                      <code className="text-[10px] font-mono text-rose-700 dark:text-rose-300 break-all leading-tight block">
                                        {cell.formula.length > 120
                                          ? cell.formula.slice(0, 120) + "..."
                                          : cell.formula}
                                      </code>
                                    </div>
                                  )}
                                  {cell.value && (
                                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 break-words">
                                      → {cell.value.length > 100 ? cell.value.slice(0, 100) + "..." : cell.value}
                                    </div>
                                  )}
                                  {!cell.is_formula && !cell.value && (
                                    <span className="text-muted-foreground italic text-[10px]">
                                      (kosong)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30 text-[10px]">·</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatBlock({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-2.5 py-1.5 flex items-center gap-1.5",
        accent
          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
          : "bg-muted/40"
      )}
    >
      <span className={accent ? "text-rose-600" : "text-muted-foreground"}>{icon}</span>
      <div className="flex flex-col leading-none">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={cn("text-sm font-bold font-mono", accent && "text-rose-700 dark:text-rose-300")}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
