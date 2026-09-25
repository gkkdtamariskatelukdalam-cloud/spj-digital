"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber } from "@/lib/format";
import { orDash, schoolName } from "./_helpers";
// Per-document page setup — Excel 02BANDING sheet margins (cm):
//   L=0.80 R=0.80 T=1.50 B=0.80  scale=90%  landscape
import { PAGE_SETUP_02BANDING as PAGE_SETUP } from "./_page-setup";
export { PAGE_SETUP };

// ============================================================
// 02BANDING — Dokumen Hasil Pembanding
// ============================================================

interface DokumenPembandingProps {
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
  border: "1px solid #000",
};
const headerCellStyle: CSSProperties = {
  ...cellStyle,
  background: "#e2e8f0",
  fontWeight: 700,
  textAlign: "center",
};
const borderlessTableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};
const labelCellNoBorder: CSSProperties = {
  padding: "1px 6px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

export function DokumenPembanding({ group, school }: DokumenPembandingProps) {
  const vendorName = orDash(group.vendorName);
  const tglPesan = group.tglPesan;
  const formattedDate = formatDate(tglPesan);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[11pt] leading-relaxed text-slate-900">
      {/* === Title (centered, bold, 14pt per Excel) === */}
      <div className="text-center mb-5">
        <h1 className="font-bold" style={{ fontSize: "14pt" }}>DOKUMEN HASIL PEMBANDING</h1>
      </div>

      {/* === Plain-text info (borderless 2-col table) === */}
      <div className="mb-4">
        <table style={borderlessTableStyle}>
          <tbody>
            <tr>
              <td style={{ ...labelCellNoBorder, width: "180px" }}>
                Satuan Pendidikan
              </td>
              <td style={labelCellNoBorder}>: {schoolName(school)}</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Hasil pembanding</td>
              <td style={labelCellNoBorder}>
                : Tercapai kesepakatan pembelian dengan {vendorName}
              </td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Tanggal</td>
              <td style={labelCellNoBorder}>: {formattedDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Comparison table === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Nama Produk
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "180px" }}>
                Estimasi Harga
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{ ...cellStyle, textAlign: "center", color: "#64748b" }}
                >
                  Tidak ada item.
                </td>
              </tr>
            ) : (
              group.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {idx + 1}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "left" }}>
                    <div className="font-medium">
                      {item.namaBarang || item.uraian}
                    </div>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    Rp {formatNumber(item.tarifHarga)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === Catatan === */}
      <p className="text-justify text-[11pt] mb-6">
        Catatan: Harga terbaik dipilih berdasarkan perbandingan harga dari
        beberapa penyedia.
      </p>

      {/* === Right-positioned signature, text left-aligned (per Excel F131-F139) === */}
      <div style={{ marginLeft: "auto", width: "300px", textAlign: "left" }} className="text-[11pt] mb-3">
        <div>Telukdalam, {formattedDate}</div>
        <div>Pelaksana,</div>
      </div>

      <div style={{ marginLeft: "auto", width: "300px", textAlign: "left" }} className="text-[11pt]">
        <div style={{ height: "56px" }} />
        <div style={{ fontWeight: 700, textDecoration: "underline" }}>
          {orDash(school?.principalName)}
        </div>
        <div>NIP. {orDash(school?.principalNip)}</div>
      </div>
    </div>
  );
}
