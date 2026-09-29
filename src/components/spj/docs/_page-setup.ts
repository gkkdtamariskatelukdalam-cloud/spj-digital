/**
 * Per-document page setup that matches the original Excel file
 * ("Cetak ATK_2025.xlsm") EXACTLY — extracted via openpyxl from each sheet's
 * PageMargins / PageSetup / PrintSettings.
 *
 * Margins are in cm (converted from Excel's inch-based values).
 *
 * Why this matters: the previous app used a single global `@page { margin: 2.5cm }`
 * for all documents. Excel uses very different margins per sheet (some have 0.4cm
 * bottom, others 1.4cm). Using the wrong margins caused the KOP + body text
 * to overlap ("menumpuk") when printed.
 *
 * Usage:
 *   - When printing a document, inject a dynamic `<style>` tag with the
 *     matching `@page` rule based on the current document's PAGE_SETUP.
 *   - When generating a PDF via html2pdf, pass `PAGE_SETUP` to the `margin`
 *     and `jsPDF.orientation` options.
 */

export interface PageSetup {
  /** CSS margin shorthand for @page: "top right bottom left" */
  margin: string;
  /** Page orientation: "portrait" or "landscape" */
  orientation: "portrait" | "landscape";
  /**
   * Excel print scale (e.g. 90 = 90% zoom). Applied as a CSS transform: scale()
   * on the .spj-doc wrapper during print/PDF to mimic Excel's print scaling.
   * 100 = no scaling.
   */
  scale: number;
  /** Source Excel sheet name (for documentation / debugging) */
  source: string;
}

/**
 * 01PESAN — Surat Pesanan
 * Source: "Cetak ATK_2025.xlsm" sheet "01PESAN"
 * Excel margins (inches): L=0.4724 R=0.4724 T=0.3543 B=0.1575  scale=95
 * Converted to cm:        L=1.20    R=1.20    T=0.90    B=0.40
 */
export const PAGE_SETUP_01PESAN: PageSetup = {
  margin: "0.90cm 1.20cm 0.40cm 1.20cm",
  orientation: "portrait",
  scale: 95,
  source: "01PESAN",
};

/**
 * 02BANDING — Dokumen Hasil Pembanding
 * Source: "Cetak ATK_2025.xlsm" sheet "02BANDING"
 * Excel margins (inches): L=0.3150 R=0.3150 T=0.5906 B=0.3150  scale=90
 * Converted to cm:        L=0.80    R=0.80    T=1.50    B=0.80
 */
export const PAGE_SETUP_02BANDING: PageSetup = {
  margin: "1.50cm 0.80cm 0.80cm 0.80cm",
  orientation: "landscape",
  scale: 90,
  source: "02BANDING",
};

/**
 * 03RENCANA — Dokumen Perencanaan
 * Source: "Cetak ATK_2025.xlsm" sheet "03RENCANA"
 * Excel margins (inches): L=0.3150 R=0.3150 T=0.5512 B=0.1181  scale=100
 * Converted to cm:        L=0.80    R=0.80    T=1.40    B=0.30
 */
export const PAGE_SETUP_03RENCANA: PageSetup = {
  margin: "1.40cm 0.80cm 0.30cm 0.80cm",
  orientation: "landscape",
  scale: 100,
  source: "03RENCANA",
};

/**
 * 04SHP — Surat Hasil Pemeriksaan
 * Source: "Cetak ATK_2025.xlsm" sheet "04SHP"
 * Excel margins (inches): L=0.5118 R=0.5118 T=0.5906 B=0.3150  scale=90
 * Converted to cm:        L=1.30    R=1.30    T=1.50    B=0.80
 */
export const PAGE_SETUP_04SHP: PageSetup = {
  margin: "1.50cm 1.30cm 0.80cm 1.30cm",
  orientation: "portrait",
  scale: 90,
  source: "04SHP",
};

/**
 * 05BAT — Berita Acara Serah Terima
 * Source: "Cetak ATK_2025.xlsm" sheet "05BAT"
 * Excel margins (inches): L=0.3150 R=0.3150 T=0.5906 B=0.3150  scale=90
 * Converted to cm:        L=0.80    R=0.80    T=1.50    B=0.80
 */
export const PAGE_SETUP_05BAT: PageSetup = {
  margin: "1.50cm 0.80cm 0.80cm 0.80cm",
  orientation: "portrait",
  scale: 90,
  source: "05BAT",
};

/**
 * Toko — Surat Penawaran Toko
 * Source: "Cetak ATK_2025.xlsm" sheet "Toko"
 * Excel margins (inches): L=0.5118 R=0.5118 T=0.5512 B=0.5512  scale=95
 * Converted to cm:        L=1.30    R=1.30    T=1.40    B=1.40
 */
export const PAGE_SETUP_TOKO: PageSetup = {
  margin: "1.40cm 1.30cm 1.40cm 1.30cm",
  orientation: "portrait",
  scale: 95,
  source: "Toko",
};

/**
 * Kuitansi — no matching sheet in source Excel.
 * Use a sensible default: 1cm all sides, portrait, no scaling.
 */
export const PAGE_SETUP_KUITANSI: PageSetup = {
  margin: "1.00cm 1.00cm 1.00cm 1.00cm",
  orientation: "portrait",
  scale: 100,
  source: "(default — no Excel sheet for Kuitansi)",
};

/**
 * Surat Pertanggungjawaban — no matching sheet.
 * Use a sensible default.
 */
export const PAGE_SETUP_SURAT_PJ: PageSetup = {
  margin: "1.00cm 1.00cm 1.00cm 1.00cm",
  orientation: "portrait",
  scale: 100,
  source: "(default — no Excel sheet for Surat Pertanggungjawaban)",
};

/**
 * Map docId → PAGE_SETUP so document-preview.tsx can look it up
 * by the current doc's id.
 */
export const PAGE_SETUP_BY_DOC_ID: Record<string, PageSetup> = {
  "surat-pesanan": PAGE_SETUP_01PESAN,
  "dokumen-pembanding": PAGE_SETUP_02BANDING,
  "dokumen-rencana": PAGE_SETUP_03RENCANA,
  "surat-hasil-pemeriksaan": PAGE_SETUP_04SHP,
  "berita-acara-serah-terima": PAGE_SETUP_05BAT,
  "surat-penawaran-toko": PAGE_SETUP_TOKO,
  "kuitansi": PAGE_SETUP_KUITANSI,
  "surat-pertanggungjawaban": PAGE_SETUP_SURAT_PJ,
};

/**
 * Build the inline CSS for an `@page` rule for a given PageSetup.
 *
 * @returns e.g. `@page { size: A4 portrait; margin: 0.90cm 1.20cm 0.40cm 1.20cm; }`
 */
export function buildPageCss(ps: PageSetup): string {
  return `@page { size: A4 ${ps.orientation}; margin: ${ps.margin}; }`;
}

/**
 * Build a CSS transform for the document body that mimics Excel's print
 * "scale" setting (e.g. 95 → scale(0.95)). When scale is 100, returns ""
 * (no transform).
 *
 * Note: We apply the transform on a wrapper around the .spj-doc, not the
 * @page rule, because @page doesn't support scaling.
 */
export function buildScaleTransform(ps: PageSetup): string {
  if (ps.scale === 100) return "";
  const factor = ps.scale / 100;
  return `transform: scale(${factor}); transform-origin: top left;`;
}
