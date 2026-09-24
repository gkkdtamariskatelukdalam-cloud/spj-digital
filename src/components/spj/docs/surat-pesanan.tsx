"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, formatRupiah, terbilang } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  estimateCompletionDate,
  groupRomanMonth,
  orDash,
  titleCase,
} from "./_helpers";

// ============================================================
// 01PESAN — Surat Pesanan (1 continuous table for entire doc)
// ============================================================
// Per user request & PDF asli 01PESAN_07_2025.pdf: seluruh konten
// (Info block + RINCIAN PEKERJAAN + items + PPN + Terbilang +
// Instruksi + Signature) berada dalam SATU tabel ber-border kontinyu.
// Tidak ada tabel terpisah. colSpan dipakai untuk merge cells sesuai
// struktur Excel asli.
// ============================================================

interface SuratPesananProps {
  group: DocumentGroup;
  school: School | null;
}

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
};
const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  // NO border on the table itself — cell borders handle all borders.
  // This allows PPN rows to have a borderless left side (no continuous
  // vertical line from the table's left edge).
  border: "none",
};
const headerCellStyle: CSSProperties = {
  ...cellStyle,
  background: "#e2e8f0",
  fontWeight: 700,
  textAlign: "center",
};
const nameStyle: CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
};

// === Border styles per Excel 01PESAN row-by-row border analysis ===
// Each style maps to a specific cell role in the original Excel layout.

// Empty cell with NO borders — used for the left side of PPN rows
// (cols A-F in Excel are borderless, only the right side cols G-K have borders).
const borderlessCellStyle: CSSProperties = {
  border: "none",
  padding: "4px 6px",
  verticalAlign: "top",
};

// PPN label/value cell — vertical borders only (left + right, no top/bottom).
// Per user request: PPN stays on RIGHT side, only ADD vertical borders,
// NO horizontal separators between PPN rows. Font: 11px.
const ppnCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
};

// Also keep verticalOnlyCellStyle as an alias for PPN cells (used by PPN rows).
const verticalOnlyCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
};

// PPN empty left cell — LEFT border only (vertical line on left edge
// that continues from the items table above). No other borders.
const ppnEmptyCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderRight: "none",
  borderTop: "none",
  borderBottom: "none",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
};

// LEFT border only — for the number column (col A) in Instruksi rows.
// Per Excel R98-R103: A column has only Left border (no top/bottom/right).
// This ensures NO vertical line between the number and the text.
const leftOnlyCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  borderRight: "none",
  padding: "4px 6px",
  verticalAlign: "top",
};

// RIGHT border only — for the text column (cols B-K merged) in Instruksi rows.
// Per Excel R98-R103: B:K merged cell has only Right border.
// No left border → no vertical line between number and text.
const rightOnlyCellStyle: CSSProperties = {
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  borderLeft: "none",
  padding: "4px 6px",
  verticalAlign: "top",
};

// Instruksi header row — colSpan=6, LEFT + RIGHT borders only.
// Per Excel R97: A97 has Left only, K97 has Right only, no top/bottom.
const instruksiHeaderStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "4px 6px",
  verticalAlign: "top",
};

// Signature first cell (Penyedia, left side) — LEFT + BOTTOM borders only.
// Per Excel R105-R115: A column has Left only; last row has Bottom to close table.
// No right border → no vertical line between Penyedia and Pelaksana.
const signatureLeftCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderBottom: "1px solid #000",
  borderTop: "none",
  borderRight: "none",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
};

// Signature second cell (Pelaksana, right side) — RIGHT + BOTTOM borders only.
// Per Excel R105-R115: K column has Right only; last row has Bottom to close table.
// No left border → no vertical line between Penyedia and Pelaksana.
const signatureRightCellStyle: CSSProperties = {
  borderRight: "1px solid #000",
  borderBottom: "1px solid #000",
  borderTop: "none",
  borderLeft: "none",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
};

export function SuratPesanan({ group, school }: SuratPesananProps) {
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const tglPesan = group.tglPesan;
  const completion = estimateCompletionDate(group);
  const total = group.totalJumlah;

  // Filter empty items (only show items with namaBarang or uraian)
  const items = group.items.filter(
    (it) =>
      (it.namaBarang && it.namaBarang.trim()) ||
      (it.uraian && it.uraian.trim()),
  );

  // PPN/PPh calculation per Excel 01PESAN formulas:
  // - Total > 2.000.000 → pajak berlaku
  // - Non-food items → PPN 11% = total × 11%, DPP = total - PPN
  // - Food/drink items → PPh 23 2% = first item price × 2%, DPP = total - PPh
  // - Food keywords: Nasi Kotak, Kue Kotak, Kue, Aqua Botol, Aqua Cup
  // - Label: "Harga Total" if food, "Harga sebelum PPN" if non-food
  //
  // HARGA SATUAN DISPLAY RULE (per user request):
  // - If document total > 2.000.000 (PPN applies) → Harga Satuan per item = kolom AE
  //   (Total Harga Sebelum DPP = item's DPP = AF/1.11). This is the pre-PPN amount
  //   per item, so PPN can be calculated and added on top.
  // - If document total < 2.000.000 (no PPN) → Harga Satuan per item = kolom AF
  //   (Total Harga Asli = item's actual final price, no tax adjustment).
  //
  // Verified from Excel data:
  //   AE = AF / 1.11 (per-item DPP, matches 100% across all PESAN with PPN)
  //   AF = AD (final total per item, includes PPN if applicable)
  const PPN_THRESHOLD = 2_000_000;
  const FOOD_KEYWORDS = ["Nasi Kotak", "Kue Kotak", "Kue", "Aqua Botol", "Aqua Cup"];

  // Check first item for food/drink (Excel checks B19 = first item)
  const firstItemName = items.length > 0
    ? (items[0].namaBarang || items[0].uraian || "").toLowerCase()
    : "";
  const isFirstItemFood = FOOD_KEYWORDS.some(kw =>
    firstItemName.includes(kw.toLowerCase())
  );

  // Check first 6 items for label (Excel checks B19:B24)
  const firstSixItems = items.slice(0, 6);
  const hasFoodItems = firstSixItems.some(it => {
    const name = (it.namaBarang || it.uraian || "").toLowerCase();
    return FOOD_KEYWORDS.some(kw => name.includes(kw.toLowerCase()));
  });

  const isPpnApplicable = total > PPN_THRESHOLD;

  // PPN 11%: only for non-food items, = total × 11%
  const ppn11 = (isPpnApplicable && !isFirstItemFood)
    ? Math.round(total * 0.11)
    : 0;

  // PPh 23 2%: only for food/drink items, = first item price × 2%
  const firstItemPrice = items.length > 0 ? items[0].jumlah : 0;
  const pph23 = (isPpnApplicable && isFirstItemFood)
    ? Math.round(firstItemPrice * 0.02)
    : 0;

  // DPP: total - PPN (non-food) or total - PPh (food)
  const dppPpn = isPpnApplicable
    ? (isFirstItemFood ? total - pph23 : total - ppn11)
    : 0;

  // Dynamic label per Excel G89 formula
  const hargaLabel = hasFoodItems ? "Harga Total" : "Harga sebelum PPN";

  // Helper: determine displayed Harga Satuan per item based on PPN applicability.
  // Falls back to tarifHarga (kolom N) if AE/AF is null (data belum diisi).
  const getDisplayedHargaSatuan = (item: typeof items[number]): number => {
    if (isPpnApplicable) {
      // PPN applies → use kolom AE (Total Harga Sebelum DPP = DPP per item)
      return item.totalHargaSebelumDPP ?? item.tarifHarga ?? 0;
    }
    // No PPN → use kolom AF (Total Harga Asli = actual final price per item)
    return item.totalHargaAsli ?? item.tarifHarga ?? 0;
  };

  const vendorName = orDash(group.vendorName);
  const vendorOwner = orDash(group.vendorOwner);
  const principalName = orDash(school?.principalName);
  const principalNip = orDash(school?.principalNip);

  // Terbilang in Title Case per PDF spec
  const terbilangText = titleCase(terbilang(total));

  // Instruction list (spec text, exact)
  const instruksiList = [
    "Penyedia berkewajiban untuk menyediakan barang/jasa sesuai dengan surat pesanan dan dalam jangka waktu transaksi yang berlaku",
    "Penyedia berhak memintakan pembayaran sesuai total pembayaran setelah penyelesaian pekerjaan yang dimintakan pada Surat Pesanan ini dan dibuktikan dengan Berita Acara Serah Terima.",
    "Pelaksana dalam kapasitas mewakili Satuan Pendidikan berhak untuk mendapatkan barang atau jasa sesuai Surat Pesanan ini.",
    "Pelaksana berhak menolak barang/jasa yang tidak sesuai dengan surat pesanan.",
    "Pelaksana dalam kapasitas mewakili Satuan Pendidikan berkewajiban untuk menyelesaikan pembayaran sesuai dengan mekanisme pembayaran yang berlaku pada sistem.",
    "Segala perselisihan yang timbul dari Surat Pesanan ini diselesaikan antara para pihak sesuai ketentuan yang berlaku.",
  ];

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[11px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title (14pt per Excel) === */}
      <div className="text-center mb-4">
        <h1 className="font-bold" style={{ fontSize: "14pt" }}>SURAT PESANAN</h1>
      </div>

      {/* ============================================================ */}
      {/* ONE CONTINUOUS TABLE — covers Info + Items + PPN + Terbilang */}
      {/* + Instruksi + Signature. All borders connected.            */}
      {/* 6 visual cols. colSpan merges cells per section.             */}
      {/* ============================================================ */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "40px" }} />
          <col />
          <col style={{ width: "70px" }} />
          <col style={{ width: "90px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "150px" }} />
        </colgroup>
        <tbody>
          {/* === INFO BLOCK (3 visual cols, mapped to 6 via colSpan 2/2/2) === */}
          <tr>
            <td style={cellStyle} colSpan={2}>
              Paket Pesanan :
            </td>
            <td style={cellStyle} colSpan={2}>
              Nomor Surat Pesanan
            </td>
            <td style={cellStyle} colSpan={2}>
              {docNumber}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              Kegiatan jual beli dengan mitra {vendorName}
            </td>
            <td style={cellStyle} colSpan={2}>
              Tanggal Pesanan
            </td>
            <td style={cellStyle} colSpan={2}>
              {formatDate(tglPesan)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
            <td style={cellStyle} colSpan={2}>
              Tanggal Negosiasi
            </td>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              Waktu Pengerjaan Pesanan : {formatDate(tglPesan)}
            </td>
            <td style={cellStyle} colSpan={2}>
              No. BPU
            </td>
            <td style={cellStyle} colSpan={2}>
              {orDash(group.bpuCode)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              Waktu Pemrosesan Pesanan : {formatDate(tglPesan)}
            </td>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              Waktu Penyelesaian Pesanan :{" "}
              {completion ? formatDate(completion) : "—"}
            </td>
            <td style={cellStyle} colSpan={4}>
              Catatan Pengiriman Untuk Penyedia:
            </td>
          </tr>

          {/* === RINCIAN PEKERJAAN header (merged 6 cols, 14px) === */}
          <tr>
            <td
              style={{ ...headerCellStyle, textAlign: "center", fontSize: "14pt" }}
              colSpan={6}
            >
              RINCIAN PEKERJAAN
            </td>
          </tr>

          {/* === Items column headers (all center-aligned per user request) === */}
          <tr>
            <td style={headerCellStyle}>No</td>
            <td style={headerCellStyle}>
              Uraian Barang / Jasa
            </td>
            <td style={headerCellStyle}>Jumlah</td>
            <td style={headerCellStyle}>Satuan Ukuran</td>
            <td style={headerCellStyle}>
              Harga Satuan
            </td>
            <td style={headerCellStyle}>
              Total Harga
            </td>
          </tr>

          {/* === Items rows === */}
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{ ...cellStyle, textAlign: "center", color: "#64748b" }}
              >
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {idx + 1}
                </td>
                <td style={{ ...cellStyle, textAlign: "left" }}>
                  <div className="font-medium">
                    {item.namaBarang || item.uraian}
                  </div>
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {formatNumber(item.volume)}
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {orDash(item.satuan)}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  Rp {formatNumber(Math.round(getDisplayedHargaSatuan(item)))}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  Rp {formatNumber(item.jumlah)}
                </td>
              </tr>
            ))
          )}

          {/* === PPN + TERBILANG + INSTRUKSI + SIGNATURE SECTION === */}
          {/* All in ONE tbody with page-break-inside: avoid so they stay
              TOGETHER when printing — whether 1, 5, 20, or 66 items.
              This prevents the signature from appearing alone on a page
              with only instructions ("jangan terpotong hanya ada keterangan
              dan tanda tangan"). The PPN + Terbilang provide context. */}
          </tbody>
          <tbody style={{ pageBreakInside: "avoid" }}>

          {/* === PPN CALCULATION ROWS === */}
          {/* Per user reference image from Google Drive:
              - Empty (colSpan=2, No+Uraian): LEFT border only, no other borders
              - Label (colSpan=3, Jumlah+Satuan+Harga): FULL 4 borders (TBLR)
              - Value (colSpan=1, Total Harga): FULL 4 borders (TBLR)
              - WITH horizontal separators between PPN rows
              - Label: rata kiri, Value: rata kanan
              - PPN rule: total > 2.000.000 → PPN 11% applies; else DPP/PPN = "-" */}
          <tr>
            <td style={ppnEmptyCellStyle} colSpan={2}>&nbsp;</td>
            <td style={cellStyle} colSpan={3}>{hargaLabel}</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {formatRupiah(total)}
            </td>
          </tr>
          <tr>
            <td style={ppnEmptyCellStyle} colSpan={2}>&nbsp;</td>
            <td style={cellStyle} colSpan={3}>DPP PPN :</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {isPpnApplicable ? formatRupiah(dppPpn) : "-"}
            </td>
          </tr>
          <tr>
            <td style={ppnEmptyCellStyle} colSpan={2}>&nbsp;</td>
            <td style={cellStyle} colSpan={3}>PPN 11% :</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {(isPpnApplicable && !isFirstItemFood) ? formatRupiah(ppn11) : "-"}
            </td>
          </tr>
          <tr>
            <td style={ppnEmptyCellStyle} colSpan={2}>&nbsp;</td>
            <td style={{ ...cellStyle, fontWeight: 700 }} colSpan={3}>
              Total Pembayaran :
            </td>
            <td
              style={{
                ...cellStyle,
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              {formatRupiah(total)}
            </td>
          </tr>
          <tr>
            <td style={ppnEmptyCellStyle} colSpan={2}>&nbsp;</td>
            <td style={cellStyle} colSpan={3}>PPh 23 2% :</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {(isPpnApplicable && isFirstItemFood) ? formatRupiah(pph23) : "-"}
            </td>
          </tr>

          {/* === TERBILANG ROW === */}
          {/* Per Excel R94: Label (cols A-D merged = ~36%) + Value (cols E-K
              merged = ~64%). In 6-col HTML: label colSpan=2 + value colSpan=4.
              Full 4 borders (TBLR). Italic value. */}
          <tr>
            <td style={cellStyle} colSpan={2}>Terbilang :</td>
            <td
              style={{ ...cellStyle, fontStyle: "italic" }}
              colSpan={4}
            >
              {terbilangText}
            </td>
          </tr>

          {/* === INSTRUKSI SECTION (within the same pageBreakInside:avoid tbody) === */}
          <tr>
            <td
              style={{ ...instruksiHeaderStyle, fontWeight: 700, fontSize: "9pt", padding: "2px 6px" }}
              colSpan={6}
            >
              Instruksi ke Penyedia dan Satuan Pendidikan
            </td>
          </tr>
          {instruksiList.map((text, idx) => (
            <tr key={idx}>
              <td
                style={{
                  ...leftOnlyCellStyle,
                  textAlign: "center",
                  verticalAlign: "top",
                  fontSize: "9pt",
                  padding: "1px 6px",
                  lineHeight: 1.3,
                }}
              >
                {idx + 1}
              </td>
              <td
                style={{ ...rightOnlyCellStyle, textAlign: "justify", fontSize: "9pt", padding: "1px 6px", lineHeight: 1.3 }}
                colSpan={5}
              >
                {text}
              </td>
            </tr>
          ))}

          {/* === SIGNATURE ROW (Penyedia | Pelaksana) === */}
          <tr>
            <td
              style={{
                ...signatureLeftCellStyle,
                verticalAlign: "top",
                padding: "12px 6px 15px 40px",
              }}
              colSpan={3}
            >
              <div style={{ marginBottom: "6px" }}>Penyedia,</div>
              <div style={{ marginBottom: "20px", fontWeight: 500 }}>{vendorName || "—"}</div>
              <div style={{ minHeight: "70px", lineHeight: "70px" }}>&nbsp;</div>
              <div style={{
                fontWeight: 400,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                marginTop: "8px",
                marginBottom: "2px",
              }}>
                {vendorOwner || "—"}
              </div>
              <div>Direktur</div>
            </td>
            <td
              style={{
                ...signatureRightCellStyle,
                verticalAlign: "top",
                padding: "12px 6px 15px 40px",
              }}
              colSpan={3}
            >
              <div style={{ marginBottom: "6px" }}>Telukdalam, {formatDate(tglPesan)}</div>
              <div style={{ marginBottom: "20px" }}>Pelaksana,</div>
              <div style={{ minHeight: "70px", lineHeight: "70px" }}>&nbsp;</div>
              <div style={{
                ...nameStyle,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                marginTop: "8px",
                marginBottom: "2px",
              }}>
                {principalName}
              </div>
              <div>NIP. {principalNip}</div>
            </td>
          </tr>
          </tbody>
      </table>
    </div>
  );
}
