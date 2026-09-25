/**
 * RupiahCell — Indonesian accounting format component for currency display.
 *
 * Renders "Rp" symbol on the LEFT edge of the cell, amount on the RIGHT edge
 * (right-aligned with thousand separators using "."), no decimal places.
 * Matches Excel's "Accounting" format with currency="Rp" + zero decimals.
 *
 * Example render (inside a table cell):
 *   | Rp                       1.250.000 |
 *   | Rp                         65.000 |
 *   | Rp                  17.972.000 |
 *
 * Per user request:
 *   - "Rp di kiri"  → Rp symbol on the left
 *   - "harga di kanan" → amount right-aligned
 *   - "accounting english indonesia" → Indonesian locale (id-ID)
 *   - "2 digit di belakang koma tidak digunakan" → no decimal places
 *   - "agar lebih rapi" → neat alignment across rows
 *
 * Apply to: Harga Satuan, Total Harga, PPN, DPP, Total Pembayaran, PPh in
 * all SPJ documents (surat-pesanan, dokumen-pembanding, surat-penawaran-toko,
 * kuitansi, etc.).
 */
import type { CSSProperties } from "react";

interface RupiahCellProps {
  amount: number | null | undefined;
  /** Optional inline style override (e.g., fontWeight: 700 for totals) */
  style?: CSSProperties;
  /** If true, returns "-" instead of "Rp 0" when amount is null/0/NaN.
   *  Used in PPN section when tax doesn't apply (e.g., PPN=0 → "-"). */
  dashOnEmpty?: boolean;
  /** If true, treat amount=0 as "show 0" (Rp 0) instead of "-".
   *  Default: false (0 → "-" if dashOnEmpty, else "Rp 0"). */
  showZero?: boolean;
}

const idIDFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function RupiahCell({
  amount,
  style,
  dashOnEmpty = false,
  showZero = false,
}: RupiahCellProps) {
  // Handle null/undefined/NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return <>{dashOnEmpty ? "-" : "Rp 0"}</>;
  }

  // Handle zero
  if (amount === 0 && !showZero) {
    return <>{dashOnEmpty ? "-" : "Rp 0"}</>;
  }

  // Format amount using Indonesian locale (thousand separators with ".")
  const formatted = idIDFormatter.format(amount);

  // Render: Rp on LEFT, amount on RIGHT (accounting format)
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        alignItems: "baseline",
        gap: "0.4em",
        ...style,
      }}
    >
      <span>Rp</span>
      <span style={{ textAlign: "right" }}>{formatted}</span>
    </div>
  );
}
