"use client";

/**
 * Shared helpers for SPJ printable document templates.
 *
 * Each printable doc lives under `src/components/spj/docs/*` and follows the
 * same convention:
 *   - Wrapped in `<div className="spj-doc">…</div>`
 *   - Uses the helpers exported here for date / day-name / roman-numeral /
 *     terbilang capitalization, etc.
 *   - Sized for A4 portrait when printed (see globals.css `@media print`).
 */

import type { DocumentGroup, School } from "@/lib/types/spj";

// ─── Date helpers ───────────────────────────────────────────────

/** Indonesian day-of-week names. */
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Parse the variety of date strings stored in the DB into a Date. */
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // Already ISO?
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso;
  // dd/mm/yyyy?
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10),
      );
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/** Indonesian day name (Senin/Selasa/…). Returns "—" when un-parseable. */
export function getDayName(dateStr: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return "—";
  return DAYS[d.getDay()] ?? "—";
}

/** Extract numeric day (1-31) from a date string. Returns "—" if invalid. */
export function getDayNum(dateStr: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return "—";
  return String(d.getDate());
}

/** Extract numeric year from a date string. Returns "—" if invalid. */
export function getYearNum(dateStr: string | null): string {
  const d = parseDate(dateStr);
  if (!d) return "—";
  return String(d.getFullYear());
}

// ─── Roman numerals (months 1-12 + general 1-3999) ─────────────

const ROMAN_MONTH_MAP: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
  10: "X",
  11: "XI",
  12: "XII",
};

/** Roman numeral for a month (1..12). Falls back to a generic algorithm. */
export function toRoman(num: number | null): string {
  if (!num || num < 1) return "";
  if (ROMAN_MONTH_MAP[num]) return ROMAN_MONTH_MAP[num];
  const romans: [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let result = "";
  let n = num;
  for (const [v, s] of romans) {
    while (n >= v) {
      result += s;
      n -= v;
    }
  }
  return result;
}

// ─── Misc string helpers ────────────────────────────────────────

/** Uppercase the first letter (terbilang returns lowercase). */
export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Title Case — uppercase the first letter of EVERY word.
 * Used for the Terbilang line on official documents (e.g. Surat Pesanan),
 * which per the PDF spec renders as "Tujuh Belas Juta Sembilan Ratus Tujuh
 * Puluh Dua Ribu Rupiah" (every word capitalized).
 */
export function titleCase(s: string): string {
  if (!s) return s;
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Return `value` if truthy else the placeholder (default "—"). */
export function orDash(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

// ─── School defaults ────────────────────────────────────────────

const DEFAULT_SCHOOL_NAME = "SMA NEGERI 1 TELUKDALAM";
const DEFAULT_SCHOOL_ADDRESS =
  "Jl. Pendidikan No. 13 Kel. Pasar Teluk Dalam, Kec. Teluk Dalam, Kab. Nias Selatan, Kode Pos 22865";

/** Resolve school display name with fallback. */
export function schoolName(school: School | null): string {
  return school?.name ?? DEFAULT_SCHOOL_NAME;
}

/** Resolve school address with fallback. */
export function schoolAddress(school: School | null): string {
  return school?.address ?? DEFAULT_SCHOOL_ADDRESS;
}

// ─── Group helpers ──────────────────────────────────────────────

/** Roman numeral month for the group (1-12). Falls back to "I". */
export function groupRomanMonth(group: DocumentGroup): string {
  return toRoman(group.bulan) || "I";
}

/**
 * Build the SPJ number from a document group.
 * Format: SPJ-{noBku}/{romanMonth}/{tahun}
 */
export function buildSpjNumber(group: DocumentGroup): string {
  const bku = group.noBku?.trim() || group.bpuCode?.trim() || group.key;
  const roman = groupRomanMonth(group);
  return `SPJ-${bku}/${roman}/${group.tahun}`;
}

/**
 * Pick the most relevant date for the document.
 * Order: tglBayar → tglBast → tglPesan → today (ISO).
 */
export function pickGroupDate(group: DocumentGroup): string {
  return (
    group.tglBayar ||
    group.tglBast ||
    group.tglPesan ||
    new Date().toISOString()
  );
}

/**
 * Estimated completion date (tglPesan + 17 days, per spec). Returns the raw
 * date string or null when the source date is missing.
 */
export function estimateCompletionDate(
  group: DocumentGroup,
): string | null {
  if (!group.tglPesan) return null;
  const d = parseDate(group.tglPesan);
  if (!d) return null;
  d.setDate(d.getDate() + 17);
  return d.toISOString();
}
