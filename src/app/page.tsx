"use client";

import { useState } from "react";
import { Overview } from "@/components/analysis/overview";
import { SheetList } from "@/components/analysis/sheet-list";
import { SheetDetailView } from "@/components/analysis/sheet-detail";
import { VbaBrowser } from "@/components/analysis/vba-browser";
import { useSummary, useSheetDetail, useVbaModules } from "@/hooks/use-analysis";
import {
  LayoutDashboard,
  Table2,
  Code2,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

type View = "overview" | "sheets" | "vba";

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

  const summaryQuery = useSummary();
  const sheetQuery = useSheetDetail(selectedSheet);
  const vbaQuery = useVbaModules();

  const handleSheetSelect = (name: string) => {
    if (name) {
      setSelectedSheet(name);
      setView("sheets");
    } else {
      setView("sheets");
    }
  };

  const handleVbaClick = () => {
    setView("vba");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-violet-950/20">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4 gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-violet-600 to-rose-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate">
                Analisa Excel Cetak ATK 2025
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">
                SMA Negeri 1 Telukdalam · Pengadaan ATK
              </p>
            </div>
          </div>

          {/* View switcher */}
          <nav className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5">
            <NavButton
              active={view === "overview"}
              onClick={() => setView("overview")}
              icon={<LayoutDashboard className="h-3.5 w-3.5" />}
              label="Ringkasan"
            />
            <NavButton
              active={view === "sheets"}
              onClick={() => setView("sheets")}
              icon={<Table2 className="h-3.5 w-3.5" />}
              label="Sheets"
              badge={summaryQuery.data?.sheets.length}
            />
            <NavButton
              active={view === "vba"}
              onClick={() => setView("vba")}
              icon={<Code2 className="h-3.5 w-3.5" />}
              label="Macro VBA"
              badge={summaryQuery.data?.vba_modules.filter((m) => !m.is_empty).length}
            />
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <Lock className="h-3 w-3 text-rose-500" />
            <span className="text-muted-foreground">Password:</span>
            <Badge variant="outline" className="font-mono text-[10px] border-rose-300 text-rose-700 dark:text-rose-300">
              88dina
            </Badge>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Sidebar - only show for sheets view */}
        {view === "sheets" && summaryQuery.data && (
          <aside className="hidden md:flex w-72 lg:w-80 border-r bg-white/60 dark:bg-slate-950/60 flex-col">
            <SheetList
              sheets={summaryQuery.data.sheets}
              selectedSheet={selectedSheet}
              onSelect={handleSheetSelect}
            />
          </aside>
        )}

        {/* Mobile sheet selector */}
        {view === "sheets" && summaryQuery.data && (
          <aside className="md:hidden w-full max-h-48 border-b bg-white/60 dark:bg-slate-950/60">
            <SheetList
              sheets={summaryQuery.data.sheets}
              selectedSheet={selectedSheet}
              onSelect={handleSheetSelect}
            />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="container mx-auto p-4 sm:p-6 max-w-[1400px]">
            {/* Loading states */}
            {view === "overview" && summaryQuery.isLoading && (
              <LoadingState label="Memuat ringkasan..." />
            )}
            {view === "overview" && summaryQuery.isError && (
              <ErrorState
                message="Gagal memuat ringkasan"
                error={summaryQuery.error as Error}
              />
            )}
            {view === "overview" && summaryQuery.data && (
              <Overview
                summary={summaryQuery.data}
                onSheetClick={handleSheetSelect}
                onVbaClick={handleVbaClick}
              />
            )}

            {view === "sheets" && !selectedSheet && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Table2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h2 className="text-lg font-semibold">Pilih Sheet dari Sidebar</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Pilih salah satu sheet di panel kiri untuk melihat analisis rumus
                  dan pratinjau data dari sheet tersebut.
                </p>
              </div>
            )}
            {view === "sheets" && selectedSheet && sheetQuery.isLoading && (
              <LoadingState label={`Memuat sheet ${selectedSheet}...`} />
            )}
            {view === "sheets" && selectedSheet && sheetQuery.isError && (
              <ErrorState
                message={`Gagal memuat sheet ${selectedSheet}`}
                error={sheetQuery.error as Error}
              />
            )}
            {view === "sheets" && selectedSheet && sheetQuery.data && (
              <SheetDetailView sheet={sheetQuery.data} />
            )}

            {view === "vba" && vbaQuery.isLoading && (
              <LoadingState label="Memuat macro VBA..." />
            )}
            {view === "vba" && vbaQuery.isError && (
              <ErrorState
                message="Gagal memuat macro VBA"
                error={vbaQuery.error as Error}
              />
            )}
            {view === "vba" && vbaQuery.data && (
              <VbaBrowser modules={vbaQuery.data} />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono">
              File: Cetak ATK_2025.xlsm
            </span>
            <span>·</span>
            <span>
              {summaryQuery.data?.sheets.length ?? 0} sheets ·{" "}
              {summaryQuery.data?.vba_modules.length ?? 0} VBA modules ·{" "}
              {summaryQuery.data?.file_info.total_formulas.toLocaleString() ?? 0} formulas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Dianalisis oleh Z.ai · Password: 88dina</span>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number | undefined;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium transition-colors",
        active
          ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0 font-mono">
          {badge}
        </Badge>
      )}
    </button>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorState({ message, error }: { message: string; error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
      <h2 className="text-lg font-semibold">{message}</h2>
      <p className="text-xs text-muted-foreground mt-1 font-mono max-w-md">
        {error?.message}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => window.location.reload()}
      >
        Coba lagi
      </Button>
    </div>
  );
}
