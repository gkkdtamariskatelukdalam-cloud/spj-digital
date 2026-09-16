"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileText,
  Database,
  Table,
  Printer,
  HelpCircle,
  ListChecks,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { SheetInfo } from "@/lib/types/analysis";

const categoryConfig: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  info: {
    icon: StickyNote,
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    label: "Info",
  },
  data: {
    icon: Database,
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800",
    label: "Master Data",
  },
  reference: {
    icon: ListChecks,
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    label: "Reference",
  },
  form: {
    icon: Printer,
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    label: "Print Form",
  },
  helper: {
    icon: HelpCircle,
    color: "text-cyan-700 dark:text-cyan-300",
    bg: "bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800",
    label: "Helper",
  },
  other: {
    icon: Table,
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
    label: "Other",
  },
  log: {
    icon: FileText,
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
    label: "Log",
  },
};

interface SheetListProps {
  sheets: SheetInfo[];
  selectedSheet: string | null;
  onSelect: (name: string) => void;
}

export function SheetList({ sheets, selectedSheet, onSelect }: SheetListProps) {
  // Group by category
  const grouped = sheets.reduce((acc, sheet) => {
    const cat = sheet.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(sheet);
    return acc;
  }, {} as Record<string, SheetInfo[]>);

  const categoryOrder = ["form", "data", "reference", "helper", "info", "log", "other"];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Sheets ({sheets.length})
        </h3>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="py-2 space-y-3">
          {categoryOrder.map((cat) => {
            const items = grouped[cat];
            if (!items || items.length === 0) return null;
            const cfg = categoryConfig[cat] || categoryConfig.other;
            const Icon = cfg.icon;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-0.5">
                  <Icon className={cn("h-3 w-3", cfg.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {cfg.label}
                  </span>
                </div>
                {items.map((sheet) => {
                  const isActive = selectedSheet === sheet.name;
                  return (
                    <button
                      key={sheet.name}
                      onClick={() => onSelect(sheet.name)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-md transition-all border",
                        isActive
                          ? cn(cfg.bg, "shadow-sm")
                          : "border-transparent hover:bg-muted/60"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate flex-1",
                            isActive ? cfg.color : "text-foreground"
                          )}
                        >
                          {sheet.name}
                        </span>
                        {sheet.formulas_count > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 py-0 font-mono"
                          >
                            {sheet.formulas_count}f
                          </Badge>
                        )}
                      </div>
                      {sheet.purpose && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {sheet.purpose}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground font-mono">
                        <span>{sheet.max_row}r</span>
                        <span>{sheet.max_col}c</span>
                        <span>{sheet.non_empty_cells} cells</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
