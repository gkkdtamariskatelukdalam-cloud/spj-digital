"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  capitalize,
  estimateCompletionDate,
  groupRomanMonth,
  orDash,
} from "./_helpers";

// ============================================================
// 01PESAN — Surat Pesanan
// ============================================================

interface SuratPesananProps {
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

export function SuratPesanan({ group, school }: SuratPesananProps) {
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const tglPesan = group.tglPesan;
  const completion = estimateCompletionDate(group);
  const total = group.totalJumlah;
  const uraianHeader = "Pengadaan Alat Tulis Kantor (ATK)";

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title === */}
      <div className="text-center mb-5">
        <h1 className="font-bold uppercase text-[14px] underline underline-offset-4">
          SURAT PESANAN
        </h1>
      </div>

      {/* === Meta block === */}
      <div className="mb-4 space-y-1 text-[12px]">
        <div>
          <span className="font-semibold">Paket Pesanan:</span> {uraianHeader}
        </div>
        <div>
          <span className="font-semibold">Nomor Surat Pesanan:</span>{" "}
          <span className="font-mono">{docNumber}</span>
        </div>
        <div>
          <span className="font-semibold">Tanggal Pesanan:</span>{" "}
          {formatDate(tglPesan)}
        </div>
        <div>
          <span className="font-semibold">Waktu Pengerjaan Pesanan:</span>{" "}
          {formatDate(tglPesan)}
        </div>
        <div>
          <span className="font-semibold">Waktu Pemrosesan Pesanan:</span>{" "}
          {formatDate(tglPesan)}
        </div>
        <div>
          <span className="font-semibold">Waktu Penyelesaian Pesanan:</span>{" "}
          {completion ? formatDate(completion) : "—"}
        </div>
        <div>
          <span className="font-semibold">No. BPU:</span>{" "}
          <span className="font-mono">{orDash(group.bpuCode)}</span>
        </div>
      </div>

      {/* === Items table === */}
      <div className="mb-3">
        <div className="font-semibold text-[12px] mb-2">
          RINCIAN PEKERJAAN
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "40px" }}>
                No
              </th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Uraian Barang / Jasa
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "70px" }}>
                Jumlah
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "90px" }}>
                Satuan Ukuran
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "130px" }}>
                Harga Satuan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "150px" }}>
                Total Harga
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
                    Rp {formatNumber(item.tarifHarga)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right", fontWeight: 500 }}>
                    Rp {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
            {/* Total row */}
            <tr>
              <td style={totalCellStyle} colSpan={5}>
                JUMLAH
              </td>
              <td style={{ ...totalCellStyle, textAlign: "right" }}>
                Rp {formatNumber(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Terbilang === */}
      <div className="mb-5 text-[12px]">
        <span className="font-semibold">Terbilang:</span>{" "}
        <span className="italic">{capitalize(terbilang(total))}</span>
      </div>

      {/* === Date & signatures === */}
      <div className="flex justify-end mb-5">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(tglPesan)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-center text-[12px]">
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
        <div>
          <div className="font-medium">Bendahara Pengeluaran,</div>
          <div>&nbsp;</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.treasurerName)}
          </div>
          <div className="text-[11px]">
            NIP. <span className="font-mono">{orDash(school?.treasurerNip)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
