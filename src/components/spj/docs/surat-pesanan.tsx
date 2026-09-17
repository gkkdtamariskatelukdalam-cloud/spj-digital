"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, formatRupiah, terbilang } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  capitalize,
  estimateCompletionDate,
  groupRomanMonth,
  orDash,
} from "./_helpers";

// ============================================================
// 01PESAN — Surat Pesanan (pages 1-2) + Tanda Pembayaran (page 3)
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
const borderlessTableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};
const nameStyle: CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
};
const pageBreakStyle: CSSProperties = {
  pageBreakAfter: "always",
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
  const treasurerName = orDash(school?.treasurerName);
  const treasurerNip = orDash(school?.treasurerNip);
  const goodsManagerName = orDash(school?.goodsManagerName);
  const goodsManagerNip = orDash(school?.goodsManagerNip);

  // Rank fallbacks (spec: Penata Muda / Penata TK. I / Pembina Tk I / Direktur)
  const goodsManagerRank = school?.goodsManagerRank?.trim() || "Penata Muda";
  const treasurerRank = school?.treasurerRank?.trim() || "Penata TK. I";
  const principalRank = school?.principalRank?.trim() || "Pembina Tk I";

  // Filter empty items (only show items with namaBarang or uraian)
  const items = group.items.filter(
    (it) =>
      (it.namaBarang && it.namaBarang.trim()) ||
      (it.uraian && it.uraian.trim()),
  );

  // First item uraian for "Untuk pembayaran" line on Tanda Pembayaran
  const firstUraian =
    items.length > 0
      ? items[0].uraian || items[0].namaBarang || "Pengadaan ATK"
      : "Pengadaan ATK";

  const terbilangText = capitalize(terbilang(total));

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
      {/* ============================================================ */}
      {/* PAGE 1+2: SURAT PESANAN                                       */}
      {/* ============================================================ */}

      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title === */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[14px]">SURAT PESANAN</h1>
      </div>

      {/* === Info TABLE (3 cols, all cells bordered 1px) === */}
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

      {/* === Items table with RINCIAN PEKERJAAN merged header row === */}
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
              <th
                style={{
                  ...headerCellStyle,
                  textAlign: "right",
                  width: "130px",
                }}
              >
                Harga Satuan
              </th>
              <th
                style={{
                  ...headerCellStyle,
                  textAlign: "right",
                  width: "150px",
                }}
              >
                Total Harga
              </th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>
      </div>

      {/* === PPN CALCULATION TABLE (2 cols, ALL borders, right-aligned) === */}
      <div className="mb-3">
        <table
          style={{
            ...tableStyle,
            width: "60%",
            marginLeft: "auto",
          }}
        >
          <tbody>
            <tr>
              <td style={cellStyle}>Harga sebelum PPN</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>
                {formatRupiah(total)}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>DPP PPN :</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>
                {formatRupiah(dppPpn)}
              </td>
            </tr>
            <tr>
              <td style={cellStyle}>PPN 11% :</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>
                {formatRupiah(ppn11)}
              </td>
            </tr>
            <tr>
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
              <td style={cellStyle}>PPh 23 2% :</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === TERBILANG TABLE (2 cols, ALL borders, italic value) === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={{ ...cellStyle, width: "15%" }}>Terbilang</td>
              <td style={{ ...cellStyle, fontStyle: "italic" }}>
                {terbilangText}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === INSTRUKSI section (outside table, no border) === */}
      <div className="mb-5">
        <div className="font-bold mb-2">
          Instruksi ke Penyedia dan Satuan Pendidikan
        </div>
        <ol className="list-decimal pl-6 space-y-1 text-justify">
          {instruksiList.map((text, idx) => (
            <li key={idx}>{text}</li>
          ))}
        </ol>
      </div>

      {/* === 2-column borderless signature table (Penyedia | Pelaksana) === */}
      <table style={borderlessTableStyle}>
        <tbody>
          <tr>
            <td
              style={{
                width: "15%",
              }}
            />
            <td
              style={{
                width: "35%",
                textAlign: "left",
                padding: "0 8px",
                verticalAlign: "top",
              }}
            >
              <div>Penyedia,</div>
              <div>{vendorName || "—"}</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 400 }}>{vendorOwner || "—"}</div>
              <div>Direktur</div>
            </td>
            <td
              style={{
                width: "35%",
                textAlign: "left",
                padding: "0 8px",
                verticalAlign: "top",
              }}
            >
              <div>Telukdalam, {formatDate(tglPesan)}</div>
              <div>Pelaksana,</div>
              <div style={{ height: "64px" }} />
              <div style={nameStyle}>{principalName}</div>
              <div>NIP. {principalNip}</div>
            </td>
            <td
              style={{
                width: "15%",
              }}
            />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
