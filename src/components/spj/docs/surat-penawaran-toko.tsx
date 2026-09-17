"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatRupiah, formatNumber, terbilang } from "@/lib/format";
import { groupRomanMonth, orDash, titleCase } from "./_helpers";

// ============================================================
// Toko — Surat Penawaran Toko / Penyedia
// 2 bagian: Page 1 = Surat pengantar, Page 2+ = Daftar Kuantitas & Harga
// ============================================================

interface SuratPenawaranTokoProps {
  group: DocumentGroup;
  school: School | null;
}

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "12px",
};
const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "1px solid #000",
};
const headerCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
  textAlign: "center",
};
const totalCellStyle: CSSProperties = {
  ...cellStyle,
  fontWeight: 700,
};
const nameStyle: CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
};

export function SuratPenawaranToko({ group, school }: SuratPenawaranTokoProps) {
  const vendorName = orDash(group.vendorName);
  const vendorAddress = orDash(group.vendorAddress);
  const vendorOwner = orDash(group.vendorOwner);
  const tglPesan = group.tglPesan;
  const total = group.totalJumlah || 0;
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const schoolNameStr = school?.name ?? "SMA Negeri 1 Telukdalam";
  const terbilangText = titleCase(terbilang(total));

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">

      {/* ============================================================ */}
      {/* PAGE 1: SURAT PENGANTAR                                       */}
      {/* ============================================================ */}

      {/* Vendor header (big, centered) */}
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <div style={{ fontSize: "26px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          {vendorName}
        </div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>
          {vendorAddress}
        </div>
        <div style={{ borderTop: "3px solid #000", marginTop: "6px" }} />
      </div>

      {/* Date (right-aligned) */}
      <div style={{ textAlign: "right", marginTop: "8px", marginBottom: "12px", fontSize: "12px" }}>
        Telukdalam, {formatDate(tglPesan)}
      </div>

      {/* Recipient (left-aligned) */}
      <div style={{ marginBottom: "12px", fontSize: "12px", lineHeight: 1.6 }}>
        <div>Kepada Yth.</div>
        <div>Kepala SMA Negeri 1 Telukdalam</div>
        <div>Cq. Penanggungjawab Kegiatan</div>
        <div>di</div>
        <div style={{ paddingLeft: "24px" }}>Tempat</div>
      </div>

      {/* Subject (bold) */}
      <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: 700 }}>
        Perihal : Pesanan Barang
      </div>

      {/* Greeting + body */}
      <div style={{ marginBottom: "20px", fontSize: "12px", lineHeight: 1.6, textAlign: "justify" }}>
        <div>Dengan hormat,</div>
        <div style={{ marginTop: "4px" }}>
          Memenuhi maksud surat permohonan Ibu kepada kami untuk menyediakan Alat
          Tulis Kantor (ATK) sesuai dengan pesanan Nomor: {docNumber}, Tanggal{" "}
          {formatDate(tglPesan)} , bersama ini kami bersedia untuk mengadakannya.
          Bon faktur turut terlampir. Demikian, atas perhatian diucapkan terima
          kasih.
        </div>
      </div>

      {/* Signature - di kanan, teks rata kiri */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <div style={{ textAlign: "left", width: "250px", fontSize: "12px" }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase" }}>{vendorName}</div>
          <div style={{ height: "56px" }} />
          <div style={nameStyle}>{vendorOwner}</div>
          <div>Direktur</div>
        </div>
      </div>

      {/* === PAGE BREAK === */}
      <div style={{ pageBreakAfter: "always" }} />

      {/* ============================================================ */}
      {/* PAGE 2+: DAFTAR KUANTITAS DAN HARGA                           */}
      {/* ============================================================ */}

      {/* Vendor header again */}
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <div style={{ fontSize: "26px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
          {vendorName}
        </div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>
          {vendorAddress}
        </div>
        <div style={{ borderTop: "3px solid #000", marginTop: "6px" }} />
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginTop: "10px", marginBottom: "10px" }}>
        <span style={{ fontWeight: 700, fontSize: "14px", textDecoration: "underline", textTransform: "uppercase" }}>
          DAFTAR KUANTITAS DAN HARGA
        </span>
      </div>

      {/* Items table with 2-row header */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
            <th style={{ ...headerCellStyle, textAlign: "left" }}>Uraian</th>
            <th style={{ ...headerCellStyle, width: "70px" }}>Volume</th>
            <th style={{ ...headerCellStyle, width: "90px" }}>Satuan</th>
            <th style={{ ...headerCellStyle, textAlign: "right", width: "120px" }}>
              Harga Satuan
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", width: "130px" }}>
              Jumlah
            </th>
          </tr>
          <tr>
            <th style={headerCellStyle}>1</th>
            <th style={headerCellStyle}>2</th>
            <th style={headerCellStyle}>3</th>
            <th style={headerCellStyle}>4</th>
            <th style={headerCellStyle}>5</th>
            <th style={headerCellStyle}>6</th>
          </tr>
        </thead>
        <tbody>
          {group.items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...cellStyle, textAlign: "center", color: "#64748b" }}>
                Tidak ada item.
              </td>
            </tr>
          ) : (
            group.items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...cellStyle, textAlign: "center" }}>{idx + 1}</td>
                <td style={{ ...cellStyle, textAlign: "left" }}>
                  {item.namaBarang || item.uraian}
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

          {/* Total Harga row - INSIDE table */}
          <tr>
            <td style={totalCellStyle} colSpan={5}>Total Harga</td>
            <td style={{ ...totalCellStyle, textAlign: "right" }}>
                  Rp {formatNumber(total)}
            </td>
          </tr>

          {/* Terbilang row - 2 cells: label (col 1-3) | value (col 4-6) */}
          <tr>
            <td style={cellStyle} colSpan={3}>Terbilang :</td>
            <td style={{ ...cellStyle, colSpan: 3, fontStyle: "italic" }}>
              {terbilangText}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Final signature - di kanan, teks rata kiri */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
        <div style={{ textAlign: "left", width: "250px", fontSize: "12px" }}>
          <div>Telukdalam, {formatDate(tglPesan)}</div>
          <div style={{ fontWeight: 700, textTransform: "uppercase", marginTop: "4px" }}>{vendorName}</div>
          <div style={{ height: "56px" }} />
          <div style={nameStyle}>{vendorOwner}</div>
          <div>Direktur</div>
        </div>
      </div>
    </div>
  );
}
