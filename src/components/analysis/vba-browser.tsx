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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Code2,
  FileCode2,
  Printer,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { VbaModule } from "@/lib/types/analysis";

interface VbaBrowserProps {
  modules: VbaModule[];
}

export function VbaBrowser({ modules }: VbaBrowserProps) {
  const [activeModule, setActiveModule] = useState<string | null>(
    modules.find((m) => !m.is_empty)?.name ?? modules[0]?.name ?? null
  );
  const [copied, setCopied] = useState(false);

  const active = modules.find((m) => m.name === activeModule);
  const nonEmpty = modules.filter((m) => !m.is_empty);
  const empty = modules.filter((m) => m.is_empty);

  const handleCopy = () => {
    if (active) {
      navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Simple VBA syntax highlighter
  const highlightVba = (code: string) => {
    if (code.startsWith("(empty macro")) {
      return (
        <div className="text-muted-foreground italic text-sm flex items-center gap-2 py-4">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Modul ini tidak berisi kode (empty macro)
        </div>
      );
    }

    const keywords = new Set([
      "Sub", "End Sub", "Function", "End Function", "Private", "Public",
      "Dim", "As", "Set", "If", "Then", "Else", "End If", "ElseIf",
      "For", "Next", "For Each", "To", "Step", "Exit For", "Exit Sub",
      "On Error", "GoTo", "Resume", "ErrHandler", "CleanUp",
      "True", "False", "Nothing", "Empty", "Null",
      "Long", "String", "Double", "Boolean", "Integer", "Variant",
      "Worksheet", "Range", "Workbook", "Cells", "Rows", "Columns",
      "Application", "ThisWorkbook", "MsgBox", "InputBox",
      "Call", "And", "Or", "Not", "Mod", "Is", "In", "Like",
      "With", "End With", "Select Case", "Case", "End Select",
      "Const", "Option", "Explicit",
    ]);

    const lines = code.split("\n");
    return lines.map((line, i) => {
      // Comment line
      const trimmed = line.trimStart();
      if (trimmed.startsWith("'")) {
        return (
          <div key={i} className="text-emerald-700 dark:text-emerald-400 italic">
            {line || " "}
          </div>
        );
      }
      // Tokenize and highlight
      const tokens = line.split(/(\s+|[(),])/);
      return (
        <div key={i} className="whitespace-pre-wrap break-words">
          {tokens.map((tok, idx) => {
            if (!tok) return null;
            if (keywords.has(tok.trim())) {
              return (
                <span key={idx} className="text-violet-700 dark:text-violet-300 font-semibold">
                  {tok}
                </span>
              );
            }
            // String literal
            if (/^"[^"]*"/.test(tok) || /^"[^"]*$/.test(tok)) {
              return (
                <span key={idx} className="text-amber-700 dark:text-amber-300">
                  {tok}
                </span>
              );
            }
            // Number
            if (/^\d+$/.test(tok.trim())) {
              return (
                <span key={idx} className="text-cyan-700 dark:text-cyan-300">
                  {tok}
                </span>
              );
            }
            return <span key={idx}>{tok}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <Card className="border-l-4 border-l-violet-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Code2 className="h-5 w-5 text-violet-600" />
            Analisis Macro VBA
          </CardTitle>
          <CardDescription className="text-sm">
            Visual Basic for Applications (VBA) macro modules yang terdapat dalam
            file .xlsm ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SummaryStat
              icon={<FileCode2 className="h-3.5 w-3.5" />}
              label="Total Modul"
              value={modules.length}
              color="text-violet-700 dark:text-violet-300"
              bg="bg-violet-50 dark:bg-violet-950/40"
            />
            <SummaryStat
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Modul Aktif"
              value={nonEmpty.length}
              color="text-emerald-700 dark:text-emerald-300"
              bg="bg-emerald-50 dark:bg-emerald-950/40"
            />
            <SummaryStat
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              label="Modul Kosong"
              value={empty.length}
              color="text-amber-700 dark:text-amber-300"
              bg="bg-amber-50 dark:bg-amber-950/40"
            />
            <SummaryStat
              icon={<Printer className="h-3.5 w-3.5" />}
              label="SavePDF Macros"
              value={modules.filter((m) => m.code.includes("SavePDF")).length}
              color="text-rose-700 dark:text-rose-300"
              bg="bg-rose-50 dark:bg-rose-950/40"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Module list */}
        <Card className="lg:col-span-4 xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <FileCode2 className="h-4 w-4" />
              Modul ({modules.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="px-2 py-1 space-y-0.5">
                {nonEmpty.map((m) => (
                  <ModuleButton
                    key={m.name}
                    module={m}
                    active={activeModule === m.name}
                    onClick={() => setActiveModule(m.name)}
                  />
                ))}
                {empty.length > 0 && (
                  <div className="pt-2 mt-2 border-t">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground">
                      Modul Kosong
                    </div>
                    {empty.map((m) => (
                      <ModuleButton
                        key={m.name}
                        module={m}
                        active={activeModule === m.name}
                        onClick={() => setActiveModule(m.name)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Code viewer */}
        <Card className="lg:col-span-8 xl:col-span-9">
          {active && (
            <>
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-mono flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-violet-600" />
                      {active.name}
                      {active.is_empty ? (
                        <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                          KOSONG
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 dark:text-emerald-300">
                          AKTIF
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Stream: <code className="font-mono">{active.stream}</code> · Target:{" "}
                      <span className="font-medium">{active.sheet_target}</span>
                    </CardDescription>
                  </div>
                  {!active.is_empty && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Salin Kode
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {active.purpose && (
                  <div className="rounded-md bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 p-2.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-violet-700 dark:text-violet-300">
                          Tujuan Macro:{" "}
                        </span>
                        <span className="text-violet-800 dark:text-violet-200">
                          {active.purpose}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-slate-50 dark:bg-slate-950 overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 border-b flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {active.code_length} chars · VBA
                    </span>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs font-mono p-3 leading-relaxed">
                      <code>{highlightVba(active.code)}</code>
                    </pre>
                  </ScrollArea>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function ModuleButton({
  module: m,
  active,
  onClick,
}: {
  module: VbaModule;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2.5 py-1.5 rounded-md transition-all border text-xs",
        active
          ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-mono font-medium truncate flex-1",
            active ? "text-violet-700 dark:text-violet-300" : "text-foreground"
          )}
        >
          {m.name}
        </span>
        <ChevronRight
          className={cn(
            "h-3 w-3 flex-shrink-0",
            active ? "text-violet-600" : "text-muted-foreground/40"
          )}
        />
      </div>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[9px] text-muted-foreground truncate flex-1">
          → {m.sheet_target}
        </span>
        {!m.is_empty && (
          <span className="text-[9px] text-emerald-600 font-mono">
            {m.code_length}c
          </span>
        )}
      </div>
    </button>
  );
}

function SummaryStat({
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
        <span className="text-[9px] uppercase tracking-wide font-bold">
          {label}
        </span>
      </div>
      <div className={cn("text-lg font-bold font-mono", color)}>{value}</div>
    </div>
  );
}
