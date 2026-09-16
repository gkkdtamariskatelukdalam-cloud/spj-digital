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

export function SuratPesanan({ group, school }: SuratPesananProps) {
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const tglPesan = group.tglPesan;
  const completion = estimateCompletionDate(group);
  const total = group.totalJumlah;
  const vendorName = orDash(group.vendorName);
  const vendorOwner = orDash(group.vendorOwner);
  const principalName = orDash(school?.principalName);
  const principalNip = orDash(school?.principalNip);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title === */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[14px]">SURAT PESANAN</h1>
      </div>

      {/* === Info TABLE (3 cols, all cells bordered) === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, width: "33%" }}>Paket Pesanan :</td>
              <td style={{ ...cellStyle, width: "25%" }}>Nomor Surat Pesanan</td>
              <td style={{ ...cellStyle, width: "42%" }}>{docNumber}</td>
            </tr>
            <tr>
              <td style={cellStyle}>
                Kegiatan jual beli dengan mitra {vendorName}
              </td>
              <td style={cellStyle}>Tanggal Pesanan</td>
              <td style={cellStyle}>{formatDate(tglPesan)}</td>
            </tr>
            <tr>
              <td style={cellStyle}>&nbsp;</td>
              <td style={cellStyle}>Tanggal Negosiasi</td>
              <td style={cellStyle}>&nbsp;</td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <div>Waktu Pengerjaan Pesanan:</div>
                <div style={{ paddingLeft: "12px" }}>{formatDate(tglPesan)}</div>
              </td>
              <td style={cellStyle}>No. BPU</td>
              <td style={cellStyle}>{orDash(group.bpuCode)}</td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <div>Waktu Pemrosesan Pesanan:</div>
                <div style={{ paddingLeft: "12px" }}>{formatDate(tglPesan)}</div>
              </td>
              <td style={cellStyle}>&nbsp;</td>
              <td style={cellStyle}>&nbsp;</td>
            </tr>
            <tr>
              <td style={cellStyle}>
                <div>Waktu Penyelesaian Pesanan:</div>
                <div style={{ paddingLeft: "12px" }}>
                  {completion ? formatDate(completion) : "—"}
                </div>
              </td>
              <td style={cellStyle} colSpan={2}>
                Catatan Pengiriman Untuk Penyedia:
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Items table (with RINCIAN PEKERJAAN as merged header row inside) === */}
      <div className="mb-3">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th
                style={{ ...headerCellStyle, textAlign: "center" }}
                colSpan={6}
              >
                RINCIAN PEKERJAAN
              </th>
            </tr>
            <tr>
              <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Uraian Barang / Jasa
              </th>
              <th style={{ ...headerCellStyle, width: "70px" }}>Jumlah</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>
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
                    <div className="font-medium">{item.namaBarang || item.uraian}</div>
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
          </tbody>
        </table>
      </div>

      {/* === Total Pembayaran (OUTSIDE table, bold) + Terbilang (italic) === */}
      <div className="mb-5 text-[12px] space-y-1">
        <div className="font-bold">
          Total Pembayaran : Rp {formatNumber(total)}
        </div>
        <div className="italic">
          Terbilang : {capitalize(terbilang(total))}
        </div>
      </div>

      {/* === Date CENTERED === */}
      <div className="text-center mb-5 text-[12px]">
        Telukdalam, {formatDate(tglPesan)}
      </div>

      {/* === 2-column borderless signature table === */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: "50%", textAlign: "center", padding: "0 8px" }}>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {vendorOwner}
              </div>
              <div>Direktur</div>
            </td>
            <td style={{ width: "50%", textAlign: "center", padding: "0 8px" }}>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {principalName}
              </div>
              <div>Pelaksana</div>
              <div>NIP. {principalNip}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
