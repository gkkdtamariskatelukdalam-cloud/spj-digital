"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  FileText,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSchool, useMarkPrinted, useAllPrintStatuses } from "@/hooks/use-spj";
import type { DocumentGroup } from "@/lib/types/spj";

// Import all 7 document templates
import { SuratPesanan } from "@/components/spj/docs/surat-pesanan";
import { DokumenPembanding } from "@/components/spj/docs/dokumen-pembanding";
import { DokumenRencana } from "@/components/spj/docs/dokumen-rencana";
import { SuratHasilPemeriksaan } from "@/components/spj/docs/surat-hasil-pemeriksaan";
import { BeritaAcaraSerahTerima } from "@/components/spj/docs/berita-acara-serah-terima";
import { SuratPenawaranToko } from "@/components/spj/docs/surat-penawaran-toko";
import { SuratPertanggungjawaban } from "@/components/spj/docs/surat-pertanggungjawaban";
import { Kuitansi } from "@/components/spj/docs/kuitansi";

interface DocTemplate {
  id: string;
  label: string;
  short: string;
  color: string;
  render: (group: DocumentGroup, school: any) => React.ReactNode;
}

const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "surat-pesanan",
    label: "Surat Pesanan",
    short: "01 PESAN",
    color: "border-rose-400 text-rose-700 dark:text-rose-300",
    render: (g, s) => <SuratPesanan group={g} school={s} />,
  },
  {
    id: "dokumen-pembanding",
    label: "Dokumen Pembanding",
    short: "02 BANDING",
    color: "border-amber-400 text-amber-700 dark:text-amber-300",
    render: (g, s) => <DokumenPembanding group={g} school={s} />,
  },
  {
    id: "dokumen-rencana",
    label: "Dokumen Rencana",
    short: "03 RENCANA",
    color: "border-violet-400 text-violet-700 dark:text-violet-300",
    render: (g, s) => <DokumenRencana group={g} school={s} />,
  },
  {
    id: "surat-hasil-pemeriksaan",
    label: "Surat Hasil Pemeriksaan",
    short: "04 SHP",
    color: "border-cyan-400 text-cyan-700 dark:text-cyan-300",
    render: (g, s) => <SuratHasilPemeriksaan group={g} school={s} />,
  },
  {
    id: "berita-acara-serah-terima",
    label: "Berita Acara Serah Terima",
    short: "05 BAST",
    color: "border-emerald-400 text-emerald-700 dark:text-emerald-300",
    render: (g, s) => <BeritaAcaraSerahTerima group={g} school={s} />,
  },
  {
    id: "surat-penawaran-toko",
    label: "Surat Penawaran Toko",
    short: "TOKO",
    color: "border-slate-400 text-slate-700 dark:text-slate-300",
    render: (g, s) => <SuratPenawaranToko group={g} school={s} />,
  },
  {
    id: "surat-pertanggungjawaban",
    label: "Surat Pertanggungjawaban",
    short: "SPJ",
    color: "border-rose-400 text-rose-700 dark:text-rose-300",
    render: (g, s) => <SuratPertanggungjawaban group={g} school={s} />,
  },
  {
    id: "kuitansi",
    label: "Kuitansi",
    short: "KUITANSI",
    color: "border-amber-400 text-amber-700 dark:text-amber-300",
    render: (g, s) => <Kuitansi group={g} school={s} />,
  },
];

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  group: DocumentGroup | null;
  mode: "single" | "all" | "vendor"; // single = 1 pesanan, all = semua, vendor = per toko
  allGroups?: DocumentGroup[];
  vendorName?: string | null; // for vendor mode display
  initialDocId?: string; // if specified, start with this doc
}

export function DocumentPreview({
  open,
  onClose,
  group,
  mode,
  allGroups = [],
  vendorName,
  initialDocId,
}: DocumentPreviewProps) {
  const { data: schoolData } = useSchool();
  const markPrintedMutation = useMarkPrinted();
  const { data: allPrintStatusesData } = useAllPrintStatuses();
  const school = schoolData?.item ?? null;
  
  // State for navigation
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  // Determine which groups to show (all, vendor, or single)
  const groups = mode === "all" || mode === "vendor" ? allGroups : group ? [group] : [];
  const currentGroup = groups[currentGroupIdx] || null;
  const currentDoc = DOC_TEMPLATES[currentDocIdx];

  // Reset when opened
  useEffect(() => {
    if (open) {
      setCurrentDocIdx(0);
      setCurrentGroupIdx(0);
    }
  }, [open]);

  // Set initial doc if specified
  useEffect(() => {
    if (open && initialDocId) {
      const idx = DOC_TEMPLATES.findIndex((d) => d.id === initialDocId);
      if (idx >= 0) setCurrentDocIdx(idx);
    }
  }, [open, initialDocId]);

  if (!open || !currentGroup) return null;

  const totalSteps = (mode === "all" || mode === "vendor") ? groups.length * DOC_TEMPLATES.length : DOC_TEMPLATES.length;
  const currentStep = currentGroupIdx * DOC_TEMPLATES.length + currentDocIdx + 1;

  const handleNext = () => {
    if (currentDocIdx < DOC_TEMPLATES.length - 1) {
      setCurrentDocIdx(currentDocIdx + 1);
    } else if ((mode === "all" || mode === "vendor") && currentGroupIdx < groups.length - 1) {
      setCurrentGroupIdx(currentGroupIdx + 1);
      setCurrentDocIdx(0);
    }
  };

  const handlePrev = () => {
    if (currentDocIdx > 0) {
      setCurrentDocIdx(currentDocIdx - 1);
    } else if ((mode === "all" || mode === "vendor") && currentGroupIdx > 0) {
      setCurrentGroupIdx(currentGroupIdx - 1);
      setCurrentDocIdx(DOC_TEMPLATES.length - 1);
    }
  };

  // Mark document as printed (for tracking)
  const markAsPrinted = async (groupKey: string, docType: string) => {
    try {
      await markPrintedMutation.mutateAsync({ groupKey, docType });
    } catch (e) {
      console.error("Failed to mark as printed:", e);
    }
  };

  // Download PDF using html2pdf
  const handleDownloadPDF = async () => {
    setDownloading(true);
    toast.info("Mempersiapkan PDF...");
    
    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default;
      
      // Create a temporary container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Render all docs for current group (or all groups)
      const groupsToRender = (mode === "all" || mode === "vendor") ? groups : [currentGroup];
      
      for (const g of groupsToRender) {
        for (const doc of DOC_TEMPLATES) {
          const docDiv = document.createElement("div");
          docDiv.className = "spj-doc-page";
          docDiv.style.cssText = `
            background: white;
            color: #0f172a;
            font-family: "Times New Roman", Times, serif;
            font-size: 12px;
            line-height: 1.5;
            padding: 2rem 2.5rem;
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
          `;
          
          // Use ReactDOM server render or clone the preview content
          const previewEl = document.querySelector("#preview-doc-content");
          if (previewEl) {
            docDiv.innerHTML = previewEl.innerHTML;
          }
          container.appendChild(docDiv);
        }
      }

      // Generate PDF
      const opt = {
        margin: 0,
        filename: (mode === "all" || mode === "vendor")
          ? mode === "vendor"
            ? `SPJ-Toko-${vendorName || "unknown"}.pdf`
            : `SPJ-Semua-${new Date().toISOString().split("T")[0]}.pdf`
          : `SPJ-Pesanan-${currentGroup.noPesan || currentGroup.noBku}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: "css", before: ".spj-doc-page" },
      };

      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      
      // Mark all rendered docs as printed
      const groupKey = currentGroup.noPesan || currentGroup.noBku || currentGroup.key;
      if (mode === "single") {
        await markAsPrinted(groupKey, currentDoc.id);
      } else {
        // Mark all docs in all groups
        for (const g of groupsToRender) {
          const gk = g.noPesan || g.noBku || g.key;
          for (const doc of DOC_TEMPLATES) {
            await markAsPrinted(gk, doc.id);
          }
        }
      }
      
      toast.success("PDF berhasil diunduh!");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error("Gagal membuat PDF: " + (e as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  // Print directly
  const handlePrint = () => {
    setPrinting(true);
    toast.info("Mempersiapkan cetak...");
    
    // Use browser print with the preview content
    const printContent = document.getElementById("preview-doc-content");
    if (!printContent) {
      toast.error("Konten tidak ditemukan");
      setPrinting(false);
      return;
    }

    // Open print window
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      toast.error("Popup diblokir. Izinkan popup untuk mencetak.");
      setPrinting(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak SPJ - ${currentGroup.noPesan || currentGroup.noBku}</title>
        <style>
          @page { size: A4 portrait; margin: 1.2cm; }
          body { margin: 0; padding: 0; font-family: "Times New Roman", Times, serif; }
          .spj-doc { 
            color: #000; 
            font-family: "Times New Roman", Times, serif;
            font-size: 12px;
            line-height: 1.5;
          }
          .spj-doc table { border-collapse: collapse; width: 100%; }
          .spj-doc td, .spj-doc th { border: 1px solid #000; padding: 4px 6px; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Mark as printed
    const groupKey = currentGroup.noPesan || currentGroup.noBku || currentGroup.key;
    if (mode === "single") {
      markAsPrinted(groupKey, currentDoc.id);
    } else {
      // Mark all docs in all groups
      for (const g of groups) {
        const gk = g.noPesan || g.noBku || g.key;
        for (const doc of DOC_TEMPLATES) {
          markAsPrinted(gk, doc.id);
        }
      }
    }
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setPrinting(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl w-full max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b bg-card flex-shrink-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <DialogTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-600" />
                {mode === "all" ? "Cetak Semua SPJ" : mode === "vendor" ? `Cetak SPJ per Toko: ${vendorName || "—"}` : "Preview Dokumen"}
                {mode === "single" && currentGroup && (
                  <Badge variant="outline" className="text-[10px] font-mono ml-1">
                    Pesanan #{currentGroup.noPesan || currentGroup.noBku}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {(mode === "all" || mode === "vendor")
                  ? `Pesanan ${currentGroupIdx + 1} dari ${groups.length} · Dokumen ${currentDocIdx + 1} dari ${DOC_TEMPLATES.length}`
                  : `Dokumen ${currentDocIdx + 1} dari ${DOC_TEMPLATES.length}`}
              </DialogDescription>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="h-8 text-xs"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1" />
                )}
                Unduh PDF
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={printing}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700"
              >
                {printing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Printer className="h-3.5 w-3.5 mr-1" />
                )}
                Cetak
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Doc type selector */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {DOC_TEMPLATES.map((doc, i) => {
              // Check if this doc is printed
              const gKey = currentGroup?.noPesan || currentGroup?.noBku || currentGroup?.key || "";
              const allStatuses = allPrintStatusesData?.allStatuses || {};
              const isPrinted = allStatuses[gKey]?.[doc.id]?.printed === true;
              
              return (
                <button
                  key={doc.id}
                  onClick={() => setCurrentDocIdx(i)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded border transition-all flex items-center gap-1",
                    i === currentDocIdx
                      ? doc.color + " bg-muted/50 font-semibold"
                      : "border-transparent text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  {isPrinted && (
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                  )}
                  {doc.short}
                </button>
              );
            })}
            
            {/* Group selector (only in "all" mode) */}
            {((mode === "all" || mode === "vendor") && groups.length > 0) && (
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={currentGroupIdx}
                  onChange={(e) => setCurrentGroupIdx(parseInt(e.target.value))}
                  className="text-xs h-7 rounded-md border bg-background px-2"
                >
                  {groups.map((g, i) => (
                    <option key={g.key} value={i}>
                      #{g.noPesan || g.noBku} - {g.vendorName || "—"} ({g.itemCount} item)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="h-7 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Sebelumnya
          </Button>
          <span className="text-xs text-muted-foreground font-mono">
            {currentStep} / {totalSteps}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={currentStep === totalSteps}
            className="h-7 text-xs"
          >
            Selanjutnya
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {/* Document Preview - scrollable */}
        <div 
          className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-y-auto overflow-x-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="p-4 flex justify-center min-w-min">
            <div
              id="preview-doc-content"
              className="bg-white shadow-lg"
              style={{
                width: "210mm",
                minHeight: "297mm",
                maxWidth: "none",
              }}
            >
              {currentDoc.render(currentGroup, school)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// === Dropdown Menu Component for Cetak ===
interface CetakMenuProps {
  group: DocumentGroup;
  onPreview: (group: DocumentGroup, docId?: string) => void;
  onDownload: (group: DocumentGroup) => void;
  onPrint: (group: DocumentGroup) => void;
}

export function CetakMenuButton({ group, onPreview, onDownload, onPrint }: CetakMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => setOpen(!open)}
      >
        <Printer className="h-3 w-3 mr-1" />
        Cetak
      </Button>
      
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-md border bg-popover shadow-lg">
            {/* Header: Kelengkapan SPJ */}
            <div className="px-2 py-1.5 border-b">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Kelengkapan SPJ Pesanan #{group.noPesan || group.noBku}
              </p>
            </div>
            
            {/* Preview all */}
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
              onClick={() => {
                onPreview(group);
                setOpen(false);
              }}
            >
              <FileText className="h-3.5 w-3.5 text-violet-600" />
              <div>
                <div className="font-medium">Preview Semua Dokumen</div>
                <div className="text-[10px] text-muted-foreground">
                  Lihat semua 7 dokumen sebelum cetak
                </div>
              </div>
            </button>

            {/* Download PDF */}
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
              onClick={() => {
                onDownload(group);
                setOpen(false);
              }}
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <div>
                <div className="font-medium">Unduh PDF</div>
                <div className="text-[10px] text-muted-foreground">
                  Download semua 7 dokumen sebagai PDF
                </div>
              </div>
            </button>

            {/* Print */}
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
              onClick={() => {
                onPrint(group);
                setOpen(false);
              }}
            >
              <Printer className="h-3.5 w-3.5 text-rose-600" />
              <div>
                <div className="font-medium">Cetak Langsung</div>
                <div className="text-[10px] text-muted-foreground">
                  Print semua 7 dokumen langsung
                </div>
              </div>
            </button>

            <div className="border-t mt-1 pt-1">
              <div className="px-2 py-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Cetak Dokumen Individual
                </p>
              </div>
              {DOC_TEMPLATES.map((doc) => (
                <button
                  key={doc.id}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted flex items-center gap-2"
                  onClick={() => {
                    onPreview(group, doc.id);
                    setOpen(false);
                  }}
                >
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  {doc.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
