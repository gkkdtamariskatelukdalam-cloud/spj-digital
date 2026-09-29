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
  padding: "4px 6px",  // Sedikit lebih tinggi dari 2px → rows lebih lega,
                        // sebagian footer terdorong ke page 2 untuk 20-item case
  verticalAlign: "top",
  fontSize: "11pt",
  lineHeight: 1.35,  // Lebih lega dari 1.2 → text tidak terlalu rapat
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
  fontSize: "14pt",
  padding: "6px 5px",
};
const labelCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
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
      {/* === 2-column table — col 1 = No (5%), col 2 = value/description === */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "5%" }} />
          <col />
        </colgroup>

        {/* === tbody 1: Title + Info block === */}
        <tbody>
          <tr>
            <td style={titleCellStyle} colSpan={2}>DOKUMEN PERENCANAAN</td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Nama Satuan Pendidikan&nbsp;&nbsp;:&nbsp;&nbsp;{schoolName(school)}</td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Alamat Satuan Pendidikan&nbsp;&nbsp;:&nbsp;&nbsp;{schoolAddress(school)}</td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Kategori Barang/Jasa&nbsp;&nbsp;:&nbsp;&nbsp;{firstUraian}</td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Jenis&nbsp;&nbsp;&nbsp;<span style={{ fontWeight: 700 }}>KETERANGAN</span></td>
          </tr>
        </tbody>

        {/* === tbody 2: Section header + Items (No | description)
            NO rowSpan, NO ✓ checkmark — items flow natural across pages. === */}
        <tbody>
          {/* Section header — full-width */}
          <tr>
            <td style={sectionHeaderStyle} colSpan={2}>Spesifikasi/ruang lingkup barang/jasa</td>
          </tr>

          {/* Per-item rows: No | Description (✓ dihapus per user request) */}
          {items.length === 0 ? (
            <tr>
              <td style={cellStyle} colSpan={2} className="text-center text-muted-foreground">
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td style={noStyle}>{idx + 1}</td>
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
            <td style={labelCellStyle} colSpan={2}>Jumlah Barang/Jasa&nbsp;&nbsp;:&nbsp;&nbsp;<span style={boldStyle}>{itemCount}</span></td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Waktu serah terima&nbsp;&nbsp;:&nbsp;&nbsp;<span style={boldStyle}>{tglPesan ? formatDate(tglPesan) : "—"}</span></td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Lokasi serah terima&nbsp;&nbsp;:&nbsp;&nbsp;<span style={boldStyle}>{schoolName(school)}</span></td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Alokasi Anggaran&nbsp;&nbsp;:&nbsp;&nbsp;<span style={boldStyle}>Bantuan Operasional Satuan Pendidikan (BOSP) {tahun}</span></td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>Perorangan/Badan Usaha&nbsp;&nbsp;&nbsp;Memenuhi syarat sebagai berikut:</td>
          </tr>
          <tr>
            <td style={labelCellStyle} colSpan={2}>&nbsp;&nbsp;&nbsp;Persyaratan penyedia&nbsp;&nbsp;:&nbsp;&nbsp;a. Identitas Penyedia&nbsp;&nbsp;&nbsp;b. NPWP;</td>
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
            Tambah jarak antar baris (marginBottom 6px per baris) per user request:
            "tambah sedikit jarak antar penandatangan, kira-kira 1 enter" */}
        <div style={{ marginTop: "12px", fontSize: "12pt", display: "flex", justifyContent: "flex-end", marginRight: "40px" }}>
          <div style={{ textAlign: "left", width: "320px" }}>
            <div style={{ whiteSpace: "nowrap", marginBottom: "6px" }}>Telukdalam, {tglPesan ? formatDate(tglPesan) : "—"}</div>
            <div style={{ whiteSpace: "nowrap", marginBottom: "6px" }}>Pelaksana</div>
            <div style={{ height: "40px" }} />
            <div style={{ ...nameStyle, whiteSpace: "nowrap", marginBottom: "6px" }}>{orDash(school?.principalName)}</div>
            <div style={{ whiteSpace: "nowrap" }}>NIP. {orDash(school?.principalNip)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
