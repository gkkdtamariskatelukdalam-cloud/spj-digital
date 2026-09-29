"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate } from "@/lib/format";
import { orDash, schoolAddress, schoolName } from "./_helpers";

// ============================================================
// 03RENCANA — Dokumen Perencanaan
// 4-column table: Label | : | No | Deskripsi
// Outer border 2px, inner border 1px
// ============================================================

interface DokumenRencanaProps {
  group: DocumentGroup;
  school: School | null;
}

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "11pt",
  lineHeight: 1.35,
  fontFamily: '"Times New Roman", Times, serif',  // Match reference Excel
};
const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "2px solid #000",
};
const titleCellStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "center",
  fontWeight: 700,
  fontSize: "16pt",  // Reference: ~16-18pt
  padding: "6px 5px",
};
const labelCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 700,  // Reference: labels are Bold (was 600)
};
const colonStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "center",
};
const noStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "center",
};
const valueMergedStyle: CSSProperties = {
  ...cellStyle,
};
const sectionHeaderStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
  background: "#f1f5f9",
};
const boldStyle: CSSProperties = { fontWeight: 700 };
const nameStyle: CSSProperties = { fontWeight: 700, textDecoration: "underline" };

export function DokumenRencana({ group, school }: DokumenRencanaProps) {
  const itemCount = group.itemCount;
  const items = group.items;
  const tglPesan = group.tglPesan;
  const tahun = group.tahun || 2025;
  // Kolom Y (Uraian Kwitansi) — dipakai untuk "Kategori Barang/Jasa"
  const firstUraian = items[0]?.uraianKwitansi || items[0]?.uraian || "Pengadaan ATK";

  return (
    <div className="spj-doc text-[11pt] leading-relaxed text-slate-900">
      {/* === 4-column table — match reference 03RENCANA_04_2025.pdf EXACTLY ===
            Col 1 (30%): Label / Spesifikasi label (empty for item rows 2+)
            Col 2 (5%):  ✓ checkmark
            Col 3 (5%):  Item number
            Col 4 (60%): Value / Description text
            NO rowSpan — first item row has label in col 1, subsequent rows have
            empty col 1. This looks identical to rowSpan but allows page breaks. */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "30%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
          <col />
        </colgroup>

        {/* === tbody 1: Title + Info block ===
            Info rows: Label (col 1) + Value (colSpan 3)
            Colon is part of label text, right-aligned within label cell */}
        <tbody>
          <tr>
            <td style={titleCellStyle} colSpan={4}>DOKUMEN PERENCANAAN</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Nama Satuan Pendidikan&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>{schoolName(school)}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Alamat Satuan Pendidikan&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>{schoolAddress(school)}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Kategori Barang/Jasa&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>{firstUraian}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Jenis</td>
            <td style={valueMergedStyle} colSpan={3}>&nbsp;</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>&nbsp;</td>
            <td style={{ ...valueMergedStyle, fontWeight: 700, textAlign: "center" }} colSpan={3}>KETERANGAN</td>
          </tr>
        </tbody>

        {/* === tbody 2: Items section ===
            Row 1: "Spesifikasi/ruang lingkup barang/jasa :" (col 1) | ✓ (col 2) | 1 (col 3) | desc (col 4)
            Row 2+: empty (col 1) | ✓ (col 2) | No (col 3) | desc (col 4)
            NO rowSpan — col 1 is just empty for rows 2+, allowing natural page breaks */}
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td style={labelCellStyle}>Spesifikasi/ruang lingkup barang/jasa&nbsp;&nbsp;:</td>
              <td style={cellStyle} colSpan={3} className="text-center text-muted-foreground">
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                {/* Col 1: label only on first item, empty for subsequent */}
                <td style={labelCellStyle}>
                  {idx === 0 ? "Spesifikasi/ruang lingkup barang/jasa\u00A0\u00A0:" : "\u00A0"}
                </td>
                {/* Col 2: ✓ checkmark */}
                <td style={{ ...noStyle }}>✓</td>
                {/* Col 3: item number */}
                <td style={noStyle}>{idx + 1}</td>
                {/* Col 4: description */}
                <td style={valueMergedStyle}>
                  {item.spesifikasiBarang || item.namaBarang || item.uraian}
                </td>
              </tr>
            ))
          )}
        </tbody>

        {/* === tbody 3: Footer info (pageBreakInside: avoid) === */}
        <tbody style={{ pageBreakInside: "avoid" as const }}>
          <tr>
            <td style={labelCellStyle}>Jumlah Barang/Jasa&nbsp;&nbsp;:</td>
            <td style={{ ...valueMergedStyle, textAlign: "center", fontWeight: 700 }} colSpan={3}>
              {itemCount}
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Waktu serah terima&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>
              <span style={boldStyle}>{tglPesan ? formatDate(tglPesan) : "—"}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Lokasi serah terima&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>
              <span style={boldStyle}>{schoolName(school)}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Alokasi Anggaran&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>
              <span style={boldStyle}>Bantuan Operasional Satuan Pendidikan (BOSP) {tahun}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Perorangan/Badan Usaha</td>
            <td style={valueMergedStyle} colSpan={3}>Memenuhi syarat sebagai berikut:</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Persyaratan penyedia&nbsp;&nbsp;:</td>
            <td style={valueMergedStyle} colSpan={3}>
              a. Identitas Penyedia<br />b. NPWP;
            </td>
          </tr>
        </tbody>
      </table>

      {/* === Catatan kaki + Signature block — wrapped together with
            pageBreakInside: avoid supaya NIP tidak sendirian di halaman baru === */}
      <div style={{ pageBreakInside: "avoid" as const }}>
        {/* Catatan kaki */}
        <div style={{ fontSize: "11pt", marginTop: "8px", fontStyle: "italic" }}>
          Misalnya Buku Teks Utama/Buku Teks Pendamping/Buku Nonteks/Kebutuhan dan
          Perlengkapan Satuan Pendidikan/Alat Peraga Pendidikan/Komputer dan
          Aksesoris/Elektronik/Jasa lainnya.
        </div>

        {/* Signature block - di kanan, teks rata kiri
            JARAK SAMA DENGAN SURAT PESANAN:
            marginBottom: 2px per baris, minHeight: 50px wet-ink space */}
        <div style={{ marginTop: "8px", fontSize: "12pt", display: "flex", justifyContent: "flex-end", marginRight: "40px" }}>
          <div style={{ textAlign: "left", width: "320px" }}>
            <div style={{ whiteSpace: "nowrap", marginBottom: "2px" }}>Telukdalam, {tglPesan ? formatDate(tglPesan) : "—"}</div>
            <div style={{ whiteSpace: "nowrap", marginBottom: "2px" }}>Pelaksana,</div>
            <div style={{ minHeight: "50px", lineHeight: "50px" }}>&nbsp;</div>
            <div style={{ ...nameStyle, whiteSpace: "nowrap", marginTop: "2px", marginBottom: "1px" }}>{orDash(school?.principalName)}</div>
            <div style={{ whiteSpace: "nowrap" }}>NIP. {orDash(school?.principalNip)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
