"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  buildSpjNumber,
  orDash,
  pickGroupDate,
  titleCase,
} from "./_helpers";
// Per-document page setup — no matching Excel sheet; use default.
import { PAGE_SETUP_SURAT_PJ as PAGE_SETUP } from "./_page-setup";
export { PAGE_SETUP };

// ============================================================
// SPJ — Surat Pertanggungjawaban
// ============================================================

interface SuratPertanggungjawabanProps {
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
const totalCellStyle: CSSProperties = {
  ...cellStyle,
  background: "#f8fafc",
  fontWeight: 700,
};
const borderlessTableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};

export function SuratPertanggungjawaban({
  group,
  school,
}: SuratPertanggungjawabanProps) {
  const total = group.totalJumlah;
  const docNumber = buildSpjNumber(group);
  const spjDate = pickGroupDate(group);
  const vendorOwner = group.vendorOwner && group.vendorOwner.trim()
    ? group.vendorOwner
    : "—";
  const vendorName = orDash(group.vendorName);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title (centered, bold, NO underline, 14pt) === */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[14px]">SURAT PERTANGGUNGJAWABAN (SPJ)</h1>
        <div className="text-[12px] mt-1">Nomor: {docNumber}</div>
      </div>

      {/* === Opening paragraph === */}
      <p className="text-justify mb-4">
        Setelah kami hitung dengan sebenarnya, maka jumlah pengeluaran yang
        dibebankan pada anggaran BOSP Tahun{" "}
        <span className="font-semibold">{group.tahun}</span> adalah sebagai
        berikut:
      </p>

      {/* === Items table === */}
      <div className="mb-3">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>Uraian</th>
              <th style={{ ...headerCellStyle, width: "60px" }}>Vol</th>
              <th style={{ ...headerCellStyle, width: "80px" }}>Satuan</th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "120px" }}>
                Tarif (Rp)
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "140px" }}>
                Jumlah (Rp)
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                    <div className="font-medium">{item.namaBarang || item.uraian}</div>
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {formatNumber(item.volume)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {orDash(item.satuan)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {formatNumber(item.tarifHarga)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
            {/* Total row: label colspan=4 (No, Uraian, Vol, Satuan), col 5 empty, col 6 = total */}
            <tr>
              <td style={totalCellStyle} colSpan={4}>
                JUMLAH TOTAL
              </td>
              <td style={totalCellStyle}>&nbsp;</td>
              <td style={{ ...totalCellStyle, textAlign: "right" }}>
                {formatNumber(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Terbilang (italic) === */}
      <div className="mb-4 text-[12px] italic">
        Terbilang : {titleCase(terbilang(total))}
      </div>

      {/* === Closing paragraph === */}
      <p className="text-justify text-[12px] mb-6">
        Demikian surat pertanggungjawaban ini dibuat dengan sebenarnya untuk
        dapat dipergunakan sebagai mestinya.
      </p>

      {/* === Right-aligned date === */}
      <div className="text-right mb-4 text-[12px]">
        Telukdalam, {formatDate(spjDate)}
      </div>

      {/* === 3-COLUMN signature block (borderless table) === */}
      <table style={borderlessTableStyle}>
        <tbody>
          <tr>
            {/* LEFT: Mengetahui - Kepala Sekolah */}
            <td style={{ width: "33%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>Mengetahui,</div>
              <div>Kepala Sekolah</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {orDash(school?.principalName)}
              </div>
              <div>NIP. {orDash(school?.principalNip)}</div>
            </td>

            {/* CENTER: Bendahara */}
            <td style={{ width: "34%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>Bendahara,</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {orDash(school?.treasurerName)}
              </div>
              <div>NIP. {orDash(school?.treasurerNip)}</div>
            </td>

            {/* RIGHT: Penerima (Vendor) */}
            <td style={{ width: "33%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>Penerima,</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {vendorOwner}
              </div>
              <div>{vendorName}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
