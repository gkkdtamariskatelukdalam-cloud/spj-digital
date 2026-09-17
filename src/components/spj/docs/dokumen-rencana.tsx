"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate } from "@/lib/format";
import { orDash, schoolAddress, schoolName } from "./_helpers";

// ============================================================
// 03RENCANA — Dokumen Perencanaan
// Entire document is ONE big table (3 cols, 2px outer / 1px inner).
// After table: Waktu/Lokasi serah terima, Alokasi, Persyaratan, signature rata kanan
// ============================================================

interface DokumenRencanaProps {
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
  border: "2px solid #000",
};
const titleCellStyle: CSSProperties = {
  ...cellStyle,
  textAlign: "center",
  fontWeight: 700,
  fontSize: "14px",
  padding: "8px 6px",
};
const labelCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
};
const subHeaderCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
  textAlign: "center",
};
const boldStyle: CSSProperties = { fontWeight: 700 };
const nameStyle: CSSProperties = { fontWeight: 700, textDecoration: "underline" };
const borderlessTableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "none",
};

export function DokumenRencana({ group, school }: DokumenRencanaProps) {
  const itemCount = group.itemCount;
  const items = group.items;
  const tglPesan = group.tglPesan;
  const tahun = group.tahun || 2025;

  // First item uraian for "Untuk pembayaran" fallback
  const firstUraian = items[0]?.uraian || "Pengadaan ATK";

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === ONE big table === */}
      <table style={tableStyle}>
        <tbody>
          {/* Title row (merged across all 3 cols) */}
          <tr>
            <td style={titleCellStyle} colSpan={3}>
              DOKUMEN PERENCANAAN
            </td>
          </tr>

          {/* Nama Satuan Pendidikan */}
          <tr>
            <td style={{ ...labelCellStyle, width: "30%" }}>
              Nama Satuan Pendidikan
            </td>
            <td style={cellStyle} colSpan={2}>
              {schoolName(school)}
            </td>
          </tr>

          {/* Alamat Satuan Pendidikan */}
          <tr>
            <td style={labelCellStyle}>Alamat Satuan Pendidikan</td>
            <td style={cellStyle} colSpan={2}>
              {schoolAddress(school)}
            </td>
          </tr>

          {/* Kategori Barang/Jasa */}
          <tr>
            <td style={labelCellStyle}>Kategori Barang/Jasa</td>
            <td style={cellStyle} colSpan={2}>
              {firstUraian}
            </td>
          </tr>

          {/* Jenis + KETERANGAN (sub-header, col 2-3 merged) */}
          <tr>
            <td style={labelCellStyle}>Jenis</td>
            <td style={subHeaderCellStyle} colSpan={2}>
              KETERANGAN
            </td>
          </tr>

          {/* Jumlah Barang/Jasa */}
          <tr>
            <td style={labelCellStyle}>Jumlah Barang/Jasa</td>
            <td style={{ ...cellStyle, textAlign: "center", width: "10%" }}>
              {itemCount}
            </td>
            <td style={cellStyle}>&nbsp;</td>
          </tr>

          {/* Spesifikasi section: col 1 = label (rowspan), col 2 = ✓, col 3 = item */}
          {items.length === 0 ? (
            <tr>
              <td style={labelCellStyle}>Spesifikasi/ruang lingkup barang/jasa:</td>
              <td style={cellStyle} colSpan={2}>
                Tidak ada item.
              </td>
            </tr>
          ) : (
            <>
              <tr>
                <td
                  style={labelCellStyle}
                  rowSpan={items.length}
                >
                  Spesifikasi/ruang lingkup barang/jasa:
                </td>
                <td style={{ ...cellStyle, textAlign: "center" }}>✓</td>
                <td style={cellStyle}>
                  <span style={{ display: "inline-block", width: "30px", textAlign: "right", paddingRight: "8px" }}>
                    1
                  </span>
                  {items[0].namaBarang || items[0].uraian}
                </td>
              </tr>
              {items.slice(1).map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ ...cellStyle, textAlign: "center" }}>✓</td>
                  <td style={cellStyle}>
                    <span style={{ display: "inline-block", width: "30px", textAlign: "right", paddingRight: "8px" }}>
                      {idx + 2}
                    </span>
                    {item.namaBarang || item.uraian}
                  </td>
                </tr>
              ))}
            </>
          )}

          {/* Waktu serah terima */}
          <tr>
            <td style={labelCellStyle}>Waktu serah terima</td>
            <td style={cellStyle} colSpan={2}>
              <span style={boldStyle}>{tglPesan ? formatDate(tglPesan) : "—"}</span>
            </td>
          </tr>

          {/* Lokasi serah terima */}
          <tr>
            <td style={labelCellStyle}>Lokasi serah terima</td>
            <td style={cellStyle} colSpan={2}>
              <span style={boldStyle}>{schoolName(school)}</span>
            </td>
          </tr>

          {/* Alokasi Anggaran */}
          <tr>
            <td style={labelCellStyle}>Alokasi Anggaran</td>
            <td style={cellStyle} colSpan={2}>
              <span style={boldStyle}>Bantuan Operasional Satuan Pendidikan (BOSP) {tahun}</span>
            </td>
          </tr>

          {/* Perorangan/Badan Usaha + Memenuhi syarat */}
          <tr>
            <td style={labelCellStyle}>
              Perorangan/Badan Usaha
            </td>
            <td style={cellStyle} colSpan={2}>
              <div>Memenuhi syarat sebagai berikut:</div>
            </td>
          </tr>

          {/* Persyaratan penyedia */}
          <tr>
            <td style={labelCellStyle}>
              <span style={boldStyle}>Persyaratan penyedia</span>
            </td>
            <td style={cellStyle} colSpan={2}>
              <div>a. Identitas Penyedia</div>
              <div>b. NPWP;</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* === Catatan kaki === */}
      <div style={{ fontSize: "10px", marginTop: "8px", fontStyle: "italic" }}>
        Misalnya Buku Teks Utama/Buku Teks Pendamping/Buku Nonteks/Kebutuhan dan
        Perlengkapan Satuan Pendidikan/Alat Peraga Pendidikan/Komputer dan
        Aksesoris/Elektronik/Jasa lainnya.
      </div>

      {/* === Signature block - RATA KANAN === */}
      <div style={{ marginTop: "20px", textAlign: "right", fontSize: "12px" }}>
        <div>Telukdalam, {tglPesan ? formatDate(tglPesan) : "—"}</div>
        <div>Pelaksana</div>
        <div style={{ height: "56px" }} />
        <div style={nameStyle}>{orDash(school?.principalName)}</div>
        <div>NIP. {orDash(school?.principalNip)}</div>
      </div>
    </div>
  );
}
