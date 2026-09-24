"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, getMonthName } from "@/lib/format";
import { Letterhead } from "@/components/spj/letterhead";
import {
  getDayName,
  getDayNum,
  getYearNum,
  groupRomanMonth,
  orDash,
  schoolAddress,
  schoolName,
} from "./_helpers";

// ============================================================
// 04SHP — Surat Hasil Pemeriksaan
// ============================================================

interface SuratHasilPemeriksaanProps {
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

export function SuratHasilPemeriksaan({
  group,
  school,
}: SuratHasilPemeriksaanProps) {
  const tglPesan = group.tglPesan;
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-PB/SMANSA-TD/${romanMonth}/${group.tahun}`;
  const pesanNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;
  const dayName = getDayName(tglPesan);
  const day = getDayNum(tglPesan);
  const monthName = group.bulan ? getMonthName(group.bulan) : "—";
  const year =
    getYearNum(tglPesan) !== "—"
      ? getYearNum(tglPesan)
      : String(group.tahun);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[11pt] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title (16pt per Excel A8) === */}
      <div className="text-center mb-4">
        <h1 className="font-bold" style={{ fontSize: "16pt" }}>SURAT HASIL PEMERIKSAAN</h1>
        <div className="text-[11pt] mt-1">NOMOR : {docNumber}</div>
      </div>

      {/* === Opening paragraph === */}
      <p className="text-justify mb-3">
        Pada hari ini, <span className="font-semibold">{dayName}</span> tanggal{" "}
        <span className="font-semibold">{day}</span> bulan{" "}
        <span className="font-semibold">{monthName}</span> tahun{" "}
        <span className="font-semibold">{year}</span>, sesuai dengan :
      </p>

      {/* === Plain-text info block (borderless 2-col table for alignment) === */}
      <div className="mb-4">
        <table style={borderlessTableStyle}>
          <tbody>
            <tr>
              <td style={{ ...labelCellNoBorder, width: "210px" }}>
                Nomor Surat Pemesanan
              </td>
              <td style={labelCellNoBorder}>: {pesanNumber}</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Tanggal</td>
              <td style={labelCellNoBorder}>: {formatDate(tglPesan)}</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Nama pekerjaan</td>
              <td style={labelCellNoBorder}>
                : Pengadaan {group.items[0]?.uraianKwitansi || "Alat Tulis Kantor (ATK)"}
              </td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Tahun</td>
              <td style={labelCellNoBorder}>: {group.tahun}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Yang bertandatangan (bold) === */}
      <p className="font-bold mb-3">Yang bertandatangan di bawah ini:</p>

      {/* === Plain-text receiver info === */}
      <div className="mb-4">
        <table style={borderlessTableStyle}>
          <tbody>
            <tr>
              <td style={{ ...labelCellNoBorder, width: "210px" }}>Nama</td>
              <td style={labelCellNoBorder}>
                : {orDash(school?.receiverName)}
              </td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Jabatan</td>
              <td style={labelCellNoBorder}>: Penerima Barang</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Nama Satuan Pendidikan</td>
              <td style={labelCellNoBorder}>: {schoolName(school)}</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Alamat Satuan Pendidikan</td>
              <td style={labelCellNoBorder}>: {schoolAddress(school)}</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>No. Telepon</td>
              <td style={labelCellNoBorder}>: {orDash(school?.receiverPhone)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-justify mb-3">
        Telah melakukan pemeriksaan terhadap hasil pekerjaan sesuai surat
        pemesanan di atas, dengan hasil:
      </p>

      {/* === Items table === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Nama Barang/Jasa
              </th>
              <th style={{ ...headerCellStyle, width: "70px" }}>Jumlah</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Satuan</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Kondisi</th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                  <td style={{ ...cellStyle, textAlign: "center" }}>Baik</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-justify text-[11pt] mb-6">
        Demikian surat hasil pemeriksaan ini dibuat untuk dapat dipergunakan
        sebagaimana mestinya.
      </p>

      {/* === 2-COLUMN signature block (PIHAK KEDUA | PIHAK PERTAMA) === */}
      <table style={borderlessTableStyle}>
        <tbody>
          <tr>
            {/* LEFT: PIHAK KEDUA (receiver) */}
            <td style={{ width: "50%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>PIHAK KEDUA,</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {orDash(school?.receiverName)}
              </div>
              <div>Penerima Barang</div>
            </td>

            {/* RIGHT: PIHAK PERTAMA (vendor) */}
            <td style={{ width: "50%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>PIHAK PERTAMA,</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {orDash(group.vendorOwner)}
              </div>
              <div>Direktur</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* === PEMERIKSA BARANG - di tengah, di bawah kedua pihak === */}
      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "11pt" }}>
        <div>PEMERIKSA BARANG,</div>
        <div style={{ height: "56px" }} />
        <div style={{ fontWeight: 700, textDecoration: "underline" }}>
          {orDash(school?.goodsManagerName)}
        </div>
        <div>Penata Muda</div>
        <div>NIP. {orDash(school?.goodsManagerNip)}</div>
      </div>
    </div>
  );
}
