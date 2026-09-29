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
  fontSize: "20pt",
  padding: "8px 6px",
};
const labelCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
};
const colonStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "center",
  width: "5%",
};
const noStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "center",
  width: "5%",
};
const valueMergedStyle: CSSProperties = {
  ...cellStyle,
};
const subHeaderCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
  textAlign: "center",
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
      {/* === 4-column table — split into multiple <tbody> for natural page breaks === */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "5%" }} />
          <col />
        </colgroup>

        {/* === tbody 1: Title + Info block === */}
        <tbody>
          {/* Title row (merged 4 cols) */}
          <tr>
            <td style={titleCellStyle} colSpan={4}>
              DOKUMEN PERENCANAAN
            </td>
          </tr>

          {/* Nama Satuan Pendidikan */}
          <tr>
            <td style={labelCellStyle}>Nama Satuan Pendidikan</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              {schoolName(school)}
            </td>
          </tr>

          {/* Alamat Satuan Pendidikan */}
          <tr>
            <td style={labelCellStyle}>Alamat Satuan Pendidikan</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              {schoolAddress(school)}
            </td>
          </tr>

          {/* Kategori Barang/Jasa */}
          <tr>
            <td style={labelCellStyle}>Kategori Barang/Jasa</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              {firstUraian}
            </td>
          </tr>

          {/* Jenis + KETERANGAN */}
          <tr>
            <td style={labelCellStyle}>Jenis</td>
            <td style={colonStyle}>&nbsp;</td>
            <td style={subHeaderCellStyle} colSpan={2}>
              KETERANGAN
            </td>
          </tr>

          {/* Jumlah Barang/Jasa */}
          <tr>
            <td style={labelCellStyle}>Jumlah Barang/Jasa</td>
            <td style={colonStyle}>:</td>
            <td style={{ ...valueMergedStyle, textAlign: "center" }} colSpan={2}>
              <span style={boldStyle}>{itemCount}</span>
            </td>
          </tr>
        </tbody>

        {/* === tbody 2: Items section — allows natural page breaks ===
            NO rowSpan — each <tr> can break across pages independently.
            "Spesifikasi/ruang lingkup barang/jasa" is a SECTION HEADER row
            (colSpan 4) above the items, NOT a rowSpan cell. This prevents
            the "all items forced to one page" issue. */}
        <tbody>
          {/* Section header row */}
          <tr>
            <td style={labelCellStyle}>Spesifikasi/ruang lingkup barang/jasa</td>
            <td style={colonStyle}>:</td>
            <td style={noStyle}>&nbsp;</td>
            <td style={{ ...subHeaderCellStyle, textAlign: "left" }}>&nbsp;</td>
          </tr>

          {/* Per-item rows — 3 visual cols: ✓ | No | Description (colSpan 2) */}
          {items.length === 0 ? (
            <tr>
              <td style={cellStyle} colSpan={4} className="text-center text-muted-foreground">
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...colonStyle, textAlign: "center" }}>✓</td>
                <td style={noStyle}>{idx + 1}</td>
                <td style={valueMergedStyle} colSpan={2}>
                  {item.spesifikasiBarang || item.namaBarang || item.uraian}
                </td>
              </tr>
            ))
          )}
        </tbody>

        {/* === tbody 3: Footer info — pageBreakInside: avoid so it stays together === */}
        <tbody style={{ pageBreakInside: "avoid" as const }}>
          {/* Waktu serah terima */}
          <tr>
            <td style={labelCellStyle}>Waktu serah terima</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              <span style={boldStyle}>{tglPesan ? formatDate(tglPesan) : "—"}</span>
            </td>
          </tr>

          {/* Lokasi serah terima */}
          <tr>
            <td style={labelCellStyle}>Lokasi serah terima</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              <span style={boldStyle}>{schoolName(school)}</span>
            </td>
          </tr>

          {/* Alokasi Anggaran */}
          <tr>
            <td style={labelCellStyle}>Alokasi Anggaran</td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              <span style={boldStyle}>Bantuan Operasional Satuan Pendidikan (BOSP) {tahun}</span>
            </td>
          </tr>

          {/* Perorangan/Badan Usaha */}
          <tr>
            <td style={labelCellStyle}>Perorangan/Badan Usaha</td>
            <td style={colonStyle}>&nbsp;</td>
            <td style={valueMergedStyle} colSpan={2}>
              Memenuhi syarat sebagai berikut:
            </td>
          </tr>

          {/* Persyaratan penyedia */}
          <tr>
            <td style={labelCellStyle}>
              <span style={boldStyle}>Persyaratan penyedia</span>
            </td>
            <td style={colonStyle}>:</td>
            <td style={valueMergedStyle} colSpan={2}>
              <div>a. Identitas Penyedia</div>
              <div>b. NPWP;</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* === Catatan kaki === */}
      <div style={{ fontSize: "11pt", marginTop: "8px", fontStyle: "italic" }}>
        Misalnya Buku Teks Utama/Buku Teks Pendamping/Buku Nonteks/Kebutuhan dan
        Perlengkapan Satuan Pendidikan/Alat Peraga Pendidikan/Komputer dan
        Aksesoris/Elektronik/Jasa lainnya.
      </div>

      {/* === Signature block - di kanan, teks rata kiri ===
          Compact spacing: marginTop 8px (was 20px) + wet-ink 30px (was 56px)
          supaya signature dekat dengan content di atasnya, tidak "melayang". */}
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
  );
}
