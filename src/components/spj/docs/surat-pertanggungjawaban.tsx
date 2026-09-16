"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  buildSpjNumber,
  capitalize,
  orDash,
  pickGroupDate,
} from "./_helpers";

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
};
const totalCellStyle: CSSProperties = {
  ...cellStyle,
  background: "#f8fafc",
  fontWeight: 700,
};

export function SuratPertanggungjawaban({
  group,
  school,
}: SuratPertanggungjawabanProps) {
  const total = group.totalJumlah;
  const docNumber = buildSpjNumber(group);
  const spjDate = pickGroupDate(group);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title === */}
      <div className="text-center mb-4">
        <h1 className="font-bold uppercase text-[14px] underline underline-offset-4">
          SURAT PERTANGGUNGJAWABAN (SPJ)
        </h1>
        <p className="text-[12px] mt-1">
          Nomor: <span className="font-mono font-semibold">{docNumber}</span>
        </p>
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
              <th style={{ ...headerCellStyle, textAlign: "center", width: "40px" }}>
                No
              </th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Uraian
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "70px" }}>
                Vol
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "90px" }}>
                Satuan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "130px" }}>
                Tarif (Rp)
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "150px" }}>
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
                    <div className="font-medium">{item.uraian}</div>
                    {item.namaBarang && (
                      <div className="text-[10px] italic text-slate-600">
                        {item.namaBarang}
                      </div>
                    )}
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
                  <td style={{ ...cellStyle, textAlign: "right", fontWeight: 500 }}>
                    {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
            {/* Total row */}
            <tr>
              <td style={totalCellStyle} colSpan={5}>
                JUMLAH TOTAL
              </td>
              <td style={{ ...totalCellStyle, textAlign: "right" }}>
                {formatNumber(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Terbilang === */}
      <div className="mb-4 text-[12px]">
        <span className="font-semibold">Terbilang:</span>{" "}
        <span className="italic">{capitalize(terbilang(total))}</span>
      </div>

      {/* === Closing paragraph === */}
      <p className="text-justify text-[12px] mb-6">
        Demikian surat pertanggungjawaban ini dibuat dengan sebenarnya untuk
        dapat dipergunakan sebagai mestinya.
      </p>

      {/* === Date === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(spjDate)}</div>
        </div>
      </div>

      {/* === Three-column signature block === */}
      <div className="grid grid-cols-3 gap-4 text-center text-[12px]">
        {/* Mengetahui - Kepala Sekolah */}
        <div>
          <div className="font-medium">Mengetahui,</div>
          <div>Kepala Sekolah</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.principalName)}
          </div>
          <div className="text-[11px]">
            NIP. <span className="font-mono">{orDash(school?.principalNip)}</span>
          </div>
        </div>
        {/* Bendahara */}
        <div>
          <div className="font-medium">Bendahara,</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.treasurerName)}
          </div>
          <div className="text-[11px]">
            NIP. <span className="font-mono">{orDash(school?.treasurerNip)}</span>
          </div>
        </div>
        {/* Penerima (Vendor) */}
        <div>
          <div className="font-medium">Penerima,</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(group.vendorOwner)}
          </div>
          <div className="text-[11px]">{orDash(group.vendorName)}</div>
        </div>
      </div>
    </div>
  );
}
