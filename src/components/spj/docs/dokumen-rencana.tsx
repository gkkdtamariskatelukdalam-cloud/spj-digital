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
  padding: "2px 5px",
  verticalAlign: "top",
  fontSize: "11pt",
  lineHeight: 1.2,
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
      {/* === 3-column table — col 1 = label/✓, col 2 = colon/No, col 3 = value/desc === */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "5%" }} />
          <col />
        </colgroup>

        {/* === tbody 1: Title + Info block (Nama, Alamat, Kategori, Jenis) === */}
        <tbody>
          <tr>
            <td style={titleCellStyle} colSpan={3}>DOKUMEN PERENCANAAN</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Nama Satuan Pendidikan</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>{schoolName(school)}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Alamat Satuan Pendidikan</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>{schoolAddress(school)}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Kategori Barang/Jasa</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>{firstUraian}</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Jenis</td>
            <td style={colonStyle}>&nbsp;</td>
            <td style={{ ...valueMergedStyle, fontWeight: 700, textAlign: "center" }}>KETERANGAN</td>
          </tr>
        </tbody>

        {/* === tbody 2: Section header + Items (✓ | No | description) ===
            Urutan per user request:
            1. Spesifikasi/ruang lingkup barang/jasa (section header)
            2. Tabel centang (items with ✓)
            NO rowSpan — items flow natural across pages. */}
        <tbody>
          {/* Section header — full-width, bold, with background */}
          <tr>
            <td style={sectionHeaderStyle} colSpan={3}>Spesifikasi/ruang lingkup barang/jasa</td>
          </tr>

          {/* Per-item rows: ✓ | No | Description */}
          {items.length === 0 ? (
            <tr>
              <td style={cellStyle} colSpan={3} className="text-center text-muted-foreground">
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...colonStyle, textAlign: "center" }}>✓</td>
                <td style={noStyle}>{idx + 1}</td>
                <td style={valueMergedStyle}>
                  {item.spesifikasiBarang || item.namaBarang || item.uraian}
                </td>
              </tr>
            ))
          )}
        </tbody>

        {/* === tbody 3: Footer info (pageBreakInside: avoid) ===
            Urutan per user request:
            3. Jumlah barang (moved HERE — was in tbody 1 before)
            4. Spesifikasi (Waktu, Lokasi, Alokasi, Perorangan, Persyaratan) */}
        <tbody style={{ pageBreakInside: "avoid" as const }}>
          <tr>
            <td style={labelCellStyle}>Jumlah Barang/Jasa</td>
            <td style={colonStyle}>:</td>
            <td style={{ ...valueMergedStyle, textAlign: "center" }}>
              <span style={boldStyle}>{itemCount}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Waktu serah terima</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>
              <span style={boldStyle}>{tglPesan ? formatDate(tglPesan) : "—"}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Lokasi serah terima</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>
              <span style={boldStyle}>{schoolName(school)}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Alokasi Anggaran</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>
              <span style={boldStyle}>Bantuan Operasional Satuan Pendidikan (BOSP) {tahun}</span>
            </td>
          </tr>
          <tr>
            <td style={labelCellStyle}>Perorangan/Badan Usaha</td>
            <td style={colonStyle}>&nbsp;</td>
            <td style={valueMergedStyle}>Memenuhi syarat sebagai berikut:</td>
          </tr>
          <tr>
            <td style={labelCellStyle}>
              <span style={boldStyle}>Persyaratan penyedia</span>
            </td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle}>
              <div>a. Identitas Penyedia</div>
              <div>b. NPWP;</div>
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

        {/* Signature block - di kanan, teks rata kiri */}
        <div style={{ marginTop: "8px", fontSize: "12pt", display: "flex", justifyContent: "flex-end", marginRight: "40px" }}>
          <div style={{ textAlign: "left", width: "320px" }}>
            <div style={{ whiteSpace: "nowrap" }}>Telukdalam, {tglPesan ? formatDate(tglPesan) : "—"}</div>
            <div style={{ whiteSpace: "nowrap" }}>Pelaksana</div>
            <div style={{ height: "30px" }} />
            <div style={{ ...nameStyle, whiteSpace: "nowrap" }}>{orDash(school?.principalName)}</div>
            <div style={{ whiteSpace: "nowrap" }}>NIP. {orDash(school?.principalNip)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
