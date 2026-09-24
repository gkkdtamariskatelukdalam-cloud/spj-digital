"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dashboard } from "@/components/spj/dashboard";
import { Transactions } from "@/components/spj/transactions";
import { MasterData } from "@/components/spj/master-data";
import { Reports } from "@/components/spj/reports";
import { Documents } from "@/components/spj/documents";
import { LetterheadSettingsPanel } from "@/components/spj/letterhead-settings";
import { ImportExcel } from "@/components/spj/import-excel";
import { DataBelanja } from "@/components/spj/data-belanja";
import { Toaster } from "@/components/ui/sonner";
import { LoginModal } from "@/components/auth/login-modal";
import { UserMenu } from "@/components/auth/user-menu";
import { canAccess } from "@/lib/auth";
import {
  LayoutDashboard,
  Receipt,
  Database,
  FileText,
  BarChart3,
  Wallet,
  Lock,
  Image as ImageIcon,
  Upload,
  ShoppingCart,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type View = "dashboard" | "transactions" | "documents" | "reports" | "master" | "letterhead" | "import" | "belanja";

interface NavItem {
  id: View;
  /** Feature key used for role-based access control. */
  featureKey: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    featureKey: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    description: "Ringkasan & statistik",
    color: "rose",
  },
  {
    id: "belanja",
    featureKey: "data-belanja",
    label: "Data Belanja",
    icon: <ShoppingCart className="h-4 w-4" />,
    description: "Semua hasil import",
    color: "violet",
  },
  {
    id: "transactions",
    featureKey: "transaksi",
    label: "Transaksi",
    icon: <Receipt className="h-4 w-4" />,
    description: "Daftar pengeluaran",
    color: "violet",
  },
  {
    id: "documents",
    featureKey: "dokumen",
    label: "Dokumen SPJ",
    icon: <FileText className="h-4 w-4" />,
    description: "Cetak pertanggungjawaban",
    color: "emerald",
  },
  {
    id: "reports",
    featureKey: "laporan",
    label: "Laporan",
    icon: <BarChart3 className="h-4 w-4" />,
    description: "Rekap & analisa",
    color: "amber",
  },
  {
    id: "master",
    featureKey: "master-data",
    label: "Master Data",
    icon: <Database className="h-4 w-4" />,
    description: "Vendor, produk, BPU",
    color: "cyan",
  },
  {
    id: "letterhead",
    featureKey: "letterhead",
    label: "Pengaturan KOP",
    icon: <ImageIcon className="h-4 w-4" />,
    description: "Logo, font, layout KOP",
    color: "rose",
  },
  {
    id: "import",
    featureKey: "import-excel",
    label: "Import Excel",
    icon: <Upload className="h-4 w-4" />,
    description: "Import data dari Excel",
    color: "emerald",
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<View>("dashboard");
  const [appLogo, setAppLogo] = useState<string | null>(null);

  // Fetch app logo for dashboard header
  useEffect(() => {
    fetch("/api/app-settings")
      .then((r) => r.json())
      .then((data) => setAppLogo(data.appLogo || null))
      .catch(() => {});
  }, [status]);

  // Filter nav items by the current user's enabled features.
  // Admin role bypasses the filter (canAccess returns true for admin).
  const visibleNavItems = useMemo(() => {
    if (status !== "authenticated") return [];
    const role = (session?.user as any)?.role;
    const enabledFeatures = (session?.user as any)?.enabledFeatures;
    return navItems.filter((item) =>
      canAccess(role, enabledFeatures, item.featureKey),
    );
  }, [session, status]);

  // Loading state — show a centered spinner while NextAuth rehydrates the
  // session from the JWT cookie.
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-rose-950/10">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  // Unauthenticated — show login overlay
  if (status !== "authenticated" || !session?.user) {
    return <LoginModal />;
  }

  // Authenticated — show the main app.
  // If the currently-selected view is not in the user's allowed features
  // (e.g., admin removed a feature after the user was last on that tab),
  // fall back to the first visible nav item, or to "dashboard" if none.
  const effectiveView =
    visibleNavItems.some((i) => i.id === view) ||
    // For admin, all features allowed — `view` is always valid
    (session.user as any).role === "admin"
      ? view
      : visibleNavItems[0]?.id ?? "dashboard";

  const user = {
    name: session.user.name,
    username: (session.user as any).username,
    role: (session.user as any).role,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-rose-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-rose-950/10">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b bg-white/85 dark:bg-slate-950/85 backdrop-blur-md print:hidden">
        <div className="flex h-14 items-center px-3 sm:px-4 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0 overflow-hidden">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="h-full w-full object-contain p-0.5" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight truncate leading-tight">
                SPJ Digital
              </h1>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">
                SMA Negeri 1 Telukdalam · BOSP 2025
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5">
            {visibleNavItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={effectiveView === item.id}
                onClick={() => setView(item.id)}
              />
            ))}
          </nav>

          {/* User menu (top-right) */}
          <div className="flex items-center gap-2">
            {/* Link to Dokumentasi SPJ */}
            <a
              href="https://spj-dokumentasi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
              title="Buka Dokumentasi SPJ di tab baru"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Dokumentasi
            </a>
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <Lock className="h-3 w-3 text-rose-500" />
              <span className="text-muted-foreground">Excel:</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-rose-300 text-rose-700 dark:text-rose-300"
              >
                88dina
              </Badge>
            </div>
            <UserMenu user={user} />
          </div>
        </div>

        {/* Mobile nav (horizontal scroll) */}
        <nav className="md:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto">
          {visibleNavItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={effectiveView === item.id}
              onClick={() => setView(item.id)}
              mobile
            />
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 max-w-[1500px]">
          {effectiveView === "dashboard" && <Dashboard />}
          {effectiveView === "belanja" && <DataBelanja />}
          {effectiveView === "transactions" && <Transactions />}
          {effectiveView === "documents" && <Documents />}
          {effectiveView === "reports" && <Reports />}
          {effectiveView === "master" && <MasterData />}
          {effectiveView === "letterhead" && <LetterheadSettingsPanel />}
          {effectiveView === "import" && <ImportExcel />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white/85 dark:bg-slate-950/85 backdrop-blur-md print:hidden">
        <div className="container mx-auto max-w-[1500px] px-4 py-3 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono">Sistem SPJ Digital</span>
            <span>·</span>
            <span>BOSP Tahun 2025</span>
            <span>·</span>
            <span>SMA Negeri 1 Telukdalam</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Data source: Cetak ATK_2025.xlsm (password: 88dina)</span>
          </div>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
  mobile,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  const colorMap: Record<string, string> = {
    rose: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    violet:
      "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800",
    emerald:
      "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    amber:
      "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    cyan: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap",
        mobile && "flex-shrink-0",
        active
          ? colorMap[item.color]
          : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {item.icon}
      <span>{item.label}</span>
    </button>
  );
}
