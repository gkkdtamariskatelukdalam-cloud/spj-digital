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
// NO horizontal separators between PPN rows.
const ppnCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "4px 6px",
  verticalAlign: "top",
};

// Also keep verticalOnlyCellStyle as an alias for PPN cells (used by PPN rows).
const verticalOnlyCellStyle: CSSProperties = {
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "4px 6px",
  verticalAlign: "top",
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
};

export function SuratPesanan({ group, school }: SuratPesananProps) {
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const tglPesan = group.tglPesan;
  const completion = estimateCompletionDate(group);
  const total = group.totalJumlah;

  // PPN calculation per spec
  const dppPpn = Math.round(total / 1.11);
  const ppn11 = total - dppPpn;

  const vendorName = orDash(group.vendorName);
  const vendorOwner = orDash(group.vendorOwner);
  const principalName = orDash(school?.principalName);
  const principalNip = orDash(school?.principalNip);

  // Filter empty items (only show items with namaBarang or uraian)
  const items = group.items.filter(
    (it) =>
      (it.namaBarang && it.namaBarang.trim()) ||
      (it.uraian && it.uraian.trim()),
  );

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
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title === */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[14px]">SURAT PESANAN</h1>
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

          {/* === RINCIAN PEKERJAAN header (merged 6 cols) === */}
          <tr>
            <td
              style={{ ...headerCellStyle, textAlign: "center" }}
              colSpan={6}
            >
              RINCIAN PEKERJAAN
            </td>
          </tr>

          {/* === Items column headers === */}
          <tr>
            <td style={headerCellStyle}>No</td>
            <td style={{ ...headerCellStyle, textAlign: "left" }}>
              Uraian Barang / Jasa
            </td>
            <td style={headerCellStyle}>Jumlah</td>
            <td style={headerCellStyle}>Satuan Ukuran</td>
            <td style={{ ...headerCellStyle, textAlign: "right" }}>
              Harga Satuan
            </td>
            <td style={{ ...headerCellStyle, textAlign: "right" }}>
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
                  Rp {formatNumber(item.tarifHarga)}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  Rp {formatNumber(item.jumlah)}
                </td>
              </tr>
            ))
          )}

          {/* === PPN CALCULATION ROWS === */}
          {/* Per user request: PPN stays on the RIGHT side (same position as
              original). Only ADD vertical borders (left + right edges of PPN
              block). NO horizontal separators between PPN rows.
              Layout: empty (colSpan=4, borderless) | label (vertical-only) | value (vertical-only) */}
          <tr>
            <td style={borderlessCellStyle} colSpan={4}>&nbsp;</td>
            <td style={verticalOnlyCellStyle}>Harga sebelum PPN</td>
            <td style={{ ...verticalOnlyCellStyle, textAlign: "right" }}>
              {formatRupiah(total)}
            </td>
          </tr>
          <tr>
            <td style={borderlessCellStyle} colSpan={4}>&nbsp;</td>
            <td style={verticalOnlyCellStyle}>DPP PPN :</td>
            <td style={{ ...verticalOnlyCellStyle, textAlign: "right" }}>
              {formatRupiah(dppPpn)}
            </td>
          </tr>
          <tr>
            <td style={borderlessCellStyle} colSpan={4}>&nbsp;</td>
            <td style={verticalOnlyCellStyle}>PPN 11% :</td>
            <td style={{ ...verticalOnlyCellStyle, textAlign: "right" }}>
              {formatRupiah(ppn11)}
            </td>
          </tr>
          <tr>
            <td style={borderlessCellStyle} colSpan={4}>&nbsp;</td>
            <td style={{ ...verticalOnlyCellStyle, fontWeight: 700 }}>
              Total Pembayaran :
            </td>
            <td
              style={{
                ...verticalOnlyCellStyle,
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              {formatRupiah(total)}
            </td>
          </tr>
          <tr>
            <td style={borderlessCellStyle} colSpan={4}>&nbsp;</td>
            <td style={verticalOnlyCellStyle}>PPh 23 2% :</td>
            <td style={{ ...verticalOnlyCellStyle, textAlign: "right" }}>-</td>
          </tr>

          {/* === TERBILANG ROW === */}
          {/* Per Excel R94: Label (cols A-D merged) + Value (cols E-K merged).
              Full 4 borders (TBLR) on both cells. Italic value. */}
          <tr>
            <td style={cellStyle}>Terbilang :</td>
            <td
              style={{ ...cellStyle, fontStyle: "italic" }}
              colSpan={5}
            >
              {terbilangText}
            </td>
          </tr>

          {/* === GAP ROW (matches Excel R95-R96) === */}
          {/* Empty row between Terbilang and Instruksi with left+right borders
              only. Provides visual spacing before the Instruksi section. */}
          <tr>
            <td style={leftOnlyCellStyle}>&nbsp;</td>
            <td style={rightOnlyCellStyle} colSpan={5}>&nbsp;</td>
          </tr>

          {/* === INSTRUKSI SECTION === */}
          {/* Per Excel R97-R103:
              - Header row (R97): colSpan=6, LEFT + RIGHT borders only (no top/bottom)
              - Number column (col A): LEFT border only (no right → no vertical
                line between number and text)
              - Text column (cols B-K merged): RIGHT border only (no left)
              - NO horizontal separators between items (no top/bottom) */}
          <tr>
            <td
              style={{ ...instruksiHeaderStyle, fontWeight: 700 }}
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
                }}
              >
                {idx + 1}
              </td>
              <td
                style={{ ...rightOnlyCellStyle, textAlign: "justify" }}
                colSpan={5}
              >
                {text}
              </td>
            </tr>
          ))}

          {/* === SIGNATURE ROW (Penyedia | Pelaksana) === */}
          {/* Per Excel R105-R115:
              - Penyedia cell (left, cols A-F): LEFT + BOTTOM borders only
                (no right → no vertical line between Penyedia and Pelaksana)
              - Pelaksana cell (right, cols G-K): RIGHT + BOTTOM borders only
                (no left → no vertical line)
              - Bottom border closes the entire table
              - No top border → seamlessly continues from Instruksi above */}
          <tr>
            <td
              style={{
                ...signatureLeftCellStyle,
                verticalAlign: "top",
              }}
              colSpan={3}
            >
              <div>Penyedia,</div>
              <div>{vendorName || "—"}</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 400 }}>{vendorOwner || "—"}</div>
              <div>Direktur</div>
            </td>
            <td
              style={{
                ...signatureRightCellStyle,
                verticalAlign: "top",
              }}
              colSpan={3}
            >
              <div>Telukdalam, {formatDate(tglPesan)}</div>
              <div>Pelaksana,</div>
              <div style={{ height: "64px" }} />
              <div style={nameStyle}>{principalName}</div>
              <div>NIP. {principalNip}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
