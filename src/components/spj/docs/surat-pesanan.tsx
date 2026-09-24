"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, formatRupiah, terbilang } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  estimateCompletionDate,
  groupRomanMonth,
  orDash,
  titleCase,
} from "./_helpers";

// ============================================================
// 01PESAN — Surat Pesanan (1 continuous table for entire doc)
// ============================================================
// Per user request & PDF asli 01PESAN_07_2025.pdf: seluruh konten
// (Info block + RINCIAN PEKERJAAN + items + PPN + Terbilang +
// Instruksi + Signature) berada dalam SATU tabel ber-border kontinyu.
// Tidak ada tabel terpisah. colSpan dipakai untuk merge cells sesuai
// struktur Excel asli.
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
const nameStyle: CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
};

export function SuratPesanan({ group, school }: SuratPesananProps) {
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const tglPesan = group.tglPesan;
  const completion = estimateCompletionDate(group);
  const total = group.totalJumlah;

  // PPN calculation per spec
  const dppPpn = Math.round(total / 1.11);
  const ppn11 = total - dppPpn;

  const vendorName = orDash(group.vendorName);
  const vendorOwner = orDash(group.vendorOwner);
  const principalName = orDash(school?.principalName);
  const principalNip = orDash(school?.principalNip);

  // Filter empty items (only show items with namaBarang or uraian)
  const items = group.items.filter(
    (it) =>
      (it.namaBarang && it.namaBarang.trim()) ||
      (it.uraian && it.uraian.trim()),
  );

  // Terbilang in Title Case per PDF spec
  const terbilangText = titleCase(terbilang(total));

  // Instruction list (spec text, exact)
  const instruksiList = [
    "Penyedia berkewajiban untuk menyediakan barang/jasa sesuai dengan surat pesanan dan dalam jangka waktu transaksi yang berlaku",
    "Penyedia berhak memintakan pembayaran sesuai total pembayaran setelah penyelesaian pekerjaan yang dimintakan pada Surat Pesanan ini dan dibuktikan dengan Berita Acara Serah Terima.",
    "Pelaksana dalam kapasitas mewakili Satuan Pendidikan berhak untuk mendapatkan barang atau jasa sesuai Surat Pesanan ini.",
    "Pelaksana berhak menolak barang/jasa yang tidak sesuai dengan surat pesanan.",
    "Pelaksana dalam kapasitas mewakili Satuan Pendidikan berkewajiban untuk menyelesaikan pembayaran sesuai dengan mekanisme pembayaran yang berlaku pada sistem.",
    "Segala perselisihan yang timbul dari Surat Pesanan ini diselesaikan antara para pihak sesuai ketentuan yang berlaku.",
  ];

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

      {/* ============================================================ */}
      {/* ONE CONTINUOUS TABLE — covers Info + Items + PPN + Terbilang */}
      {/* + Instruksi + Signature. All borders connected.            */}
      {/* 6 visual cols. colSpan merges cells per section.             */}
      {/* ============================================================ */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "40px" }} />
          <col />
          <col style={{ width: "70px" }} />
          <col style={{ width: "90px" }} />
          <col style={{ width: "130px" }} />
          <col style={{ width: "150px" }} />
        </colgroup>
        <tbody>
          {/* === INFO BLOCK (3 visual cols, mapped to 6 via colSpan 2/2/2) === */}
          <tr>
            <td style={cellStyle} colSpan={2}>
              Paket Pesanan :
            </td>
            <td style={cellStyle} colSpan={2}>
              Nomor Surat Pesanan
            </td>
            <td style={cellStyle} colSpan={2}>
              {docNumber}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              Kegiatan jual beli dengan mitra {vendorName}
            </td>
            <td style={cellStyle} colSpan={2}>
              Tanggal Pesanan
            </td>
            <td style={cellStyle} colSpan={2}>
              {formatDate(tglPesan)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
            <td style={cellStyle} colSpan={2}>
              Tanggal Negosiasi
            </td>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              <div>Waktu Pengerjaan Pesanan:</div>
              <div style={{ paddingLeft: "12px" }}>{formatDate(tglPesan)}</div>
            </td>
            <td style={cellStyle} colSpan={2}>
              No. BPU
            </td>
            <td style={cellStyle} colSpan={2}>
              {orDash(group.bpuCode)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              <div>Waktu Pemrosesan Pesanan:</div>
              <div style={{ paddingLeft: "12px" }}>{formatDate(tglPesan)}</div>
            </td>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
            <td style={cellStyle} colSpan={2}>
              &nbsp;
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={2}>
              <div>Waktu Penyelesaian Pesanan:</div>
              <div style={{ paddingLeft: "12px" }}>
                {completion ? formatDate(completion) : "—"}
              </div>
            </td>
            <td style={cellStyle} colSpan={4}>
              Catatan Pengiriman Untuk Penyedia:
            </td>
          </tr>

          {/* === RINCIAN PEKERJAAN header (merged 6 cols) === */}
          <tr>
            <td
              style={{ ...headerCellStyle, textAlign: "center" }}
              colSpan={6}
            >
              RINCIAN PEKERJAAN
            </td>
          </tr>

          {/* === Items column headers === */}
          <tr>
            <td style={headerCellStyle}>No</td>
            <td style={{ ...headerCellStyle, textAlign: "left" }}>
              Uraian Barang / Jasa
            </td>
            <td style={headerCellStyle}>Jumlah</td>
            <td style={headerCellStyle}>Satuan Ukuran</td>
            <td style={{ ...headerCellStyle, textAlign: "right" }}>
              Harga Satuan
            </td>
            <td style={{ ...headerCellStyle, textAlign: "right" }}>
              Total Harga
            </td>
          </tr>

          {/* === Items rows === */}
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{ ...cellStyle, textAlign: "center", color: "#64748b" }}
              >
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  {idx + 1}
                </td>
                <td style={{ ...cellStyle, textAlign: "left" }}>
                  <div className="font-medium">
                    {item.namaBarang || item.uraian}
                  </div>
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

          {/* === PPN CALCULATION ROWS === */}
          {/* Per Excel: PPN table is on the RIGHT side (cols G-K). Left side
              (cols A-F = No, Uraian, Jumlah, Satuan) is empty. */}
          <tr>
            <td style={cellStyle} colSpan={4}>
              &nbsp;
            </td>
            <td style={cellStyle}>Harga sebelum PPN</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {formatRupiah(total)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={4}>
              &nbsp;
            </td>
            <td style={cellStyle}>DPP PPN :</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {formatRupiah(dppPpn)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={4}>
              &nbsp;
            </td>
            <td style={cellStyle}>PPN 11% :</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              {formatRupiah(ppn11)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={4}>
              &nbsp;
            </td>
            <td style={{ ...cellStyle, fontWeight: 700 }}>
              Total Pembayaran :
            </td>
            <td
              style={{
                ...cellStyle,
                textAlign: "right",
                fontWeight: 700,
              }}
            >
              {formatRupiah(total)}
            </td>
          </tr>
          <tr>
            <td style={cellStyle} colSpan={4}>
              &nbsp;
            </td>
            <td style={cellStyle}>PPh 23 2% :</td>
            <td style={{ ...cellStyle, textAlign: "right" }}>-</td>
          </tr>

          {/* === TERBILANG ROW === */}
          {/* Label (col 1) + Value (cols 2-6 merged) — italic */}
          <tr>
            <td style={cellStyle}>Terbilang :</td>
            <td
              style={{ ...cellStyle, fontStyle: "italic" }}
              colSpan={5}
            >
              {terbilangText}
            </td>
          </tr>

          {/* === INSTRUKSI SECTION (in same table) === */}
          {/* Header row merged 6 cols */}
          <tr>
            <td
              style={{ ...cellStyle, fontWeight: 700 }}
              colSpan={6}
            >
              Instruksi ke Penyedia dan Satuan Pendidikan
            </td>
          </tr>
          {/* Numbered instruksi items: number (col 1) + text (cols 2-6 merged) */}
          {instruksiList.map((text, idx) => (
            <tr key={idx}>
              <td
                style={{
                  ...cellStyle,
                  textAlign: "center",
                  verticalAlign: "top",
                }}
              >
                {idx + 1}
              </td>
              <td
                style={{ ...cellStyle, textAlign: "justify" }}
                colSpan={5}
              >
                {text}
              </td>
            </tr>
          ))}

          {/* === SIGNATURE ROW (2 columns: Penyedia | Pelaksana) === */}
          {/* Per Excel: each signature cell spans ~5-6 cols. Penyedia on left
              (cols A-F ≈ 1-4 in our 6-col), Pelaksana on right (cols G-K ≈
              4-6 in our 6-col). For simpler split, use 3+3 cols. */}
          <tr>
            <td
              style={{
                ...cellStyle,
                verticalAlign: "top",
              }}
              colSpan={3}
            >
              <div>Penyedia,</div>
              <div>{vendorName || "—"}</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 400 }}>{vendorOwner || "—"}</div>
              <div>Direktur</div>
            </td>
            <td
              style={{
                ...cellStyle,
                verticalAlign: "top",
              }}
              colSpan={3}
            >
              <div>Telukdalam, {formatDate(tglPesan)}</div>
              <div>Pelaksana,</div>
              <div style={{ height: "64px" }} />
              <div style={nameStyle}>{principalName}</div>
              <div>NIP. {principalNip}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
