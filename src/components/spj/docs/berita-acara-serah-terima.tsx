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
// 05BAT — Berita Acara Serah Terima
// ============================================================

interface BeritaAcaraSerahTerimaProps {
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

export function BeritaAcaraSerahTerima({
  group,
  school,
}: BeritaAcaraSerahTerimaProps) {
  const tglPesan = group.tglPesan;
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-BAST/SMANSA-TD/${romanMonth}/${group.tahun}`;
  const pesanNumber = `421.3/${group.noPesan || "—"}-P/SMANSA-TD/${romanMonth}/${group.tahun}`;
  const dayName = getDayName(tglPesan);
  const day = getDayNum(tglPesan);
  const monthName = group.bulan ? getMonthName(group.bulan) : "—";
  const year =
    getYearNum(tglPesan) !== "—"
      ? getYearNum(tglPesan)
      : String(group.tahun);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title === */}
      <div className="text-center mb-4">
        <h1 className="font-bold text-[14px]">BERITA ACARA SERAH TERIMA</h1>
        <div className="text-[12px] mt-1">NOMOR : {docNumber}</div>
      </div>

      {/* === Opening paragraph === */}
      <p className="text-justify mb-3">
        Pada hari ini, <span className="font-semibold">{dayName}</span> tanggal{" "}
        <span className="font-semibold">{day}</span> bulan{" "}
        <span className="font-semibold">{monthName}</span> tahun{" "}
        <span className="font-semibold">{year}</span>, sesuai dengan :
      </p>

      {/* === Plain-text info block (borderless 2-col table) === */}
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
                : Pengadaan Alat Tulis Kantor (ATK)
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

      {/* === Numbered list (1, 2) for PIHAK PERTAMA / PIHAK KEDUA === */}
      <div className="mb-4 space-y-3 text-[12px] leading-relaxed">
        {/* 1. PIHAK PERTAMA (vendor) */}
        <div>
          <div style={{ fontWeight: 600 }}>1.</div>
          <div style={{ paddingLeft: "24px" }}>
            <table style={borderlessTableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...labelCellNoBorder, width: "180px" }}>Nama</td>
                  <td style={labelCellNoBorder}>
                    : {orDash(group.vendorOwner)}
                  </td>
                </tr>
                <tr>
                  <td style={labelCellNoBorder}>Jabatan</td>
                  <td style={labelCellNoBorder}>: Direktur</td>
                </tr>
                <tr>
                  <td style={labelCellNoBorder}>Nama Penyedia</td>
                  <td style={labelCellNoBorder}>
                    : {orDash(group.vendorName)}
                  </td>
                </tr>
                <tr>
                  <td style={labelCellNoBorder}>Alamat Penyedia</td>
                  <td style={labelCellNoBorder}>
                    : {orDash(group.vendorAddress)}
                  </td>
                </tr>
                <tr>
                  <td style={labelCellNoBorder}>No. Telepon</td>
                  <td style={labelCellNoBorder}>
                    : {orDash(group.vendorPhone)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="italic mt-1">
              Sebagai pihak yang menyerahkan, selanjutnya disebut PIHAK PERTAMA
            </p>
          </div>
        </div>

        {/* 2. PIHAK KEDUA (receiver) */}
        <div>
          <div style={{ fontWeight: 600 }}>2.</div>
          <div style={{ paddingLeft: "24px" }}>
            <table style={borderlessTableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...labelCellNoBorder, width: "180px" }}>Nama</td>
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
                  <td style={labelCellNoBorder}>
                    : {orDash(school?.receiverPhone)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="italic mt-1">
              Sebagai pihak yang menerima, selanjutnya disebut PIHAK KEDUA
            </p>
          </div>
        </div>
      </div>

      <p className="text-justify mb-3">
        PIHAK PERTAMA menyerahkan hasil pekerjaan Pengadaan Alat Tulis Kantor
        (ATK) kepada PIHAK KEDUA dengan rincian:
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
              <th style={{ ...headerCellStyle, width: "100px" }}>Diserahkan</th>
              <th style={{ ...headerCellStyle, width: "100px" }}>Diterima</th>
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
                    {formatNumber(item.volume)} {item.satuan ?? ""}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {formatNumber(item.volume)} {item.satuan ?? ""}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>Baik</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-justify text-[12px] mb-6">
        Demikian berita acara serah terima ini dibuat untuk dapat dipergunakan
        sebagaimana mestinya.
      </p>

      {/* === Right-aligned date === */}
      <div className="text-right mb-4 text-[12px]">
        Telukdalam, {formatDate(tglPesan)}
      </div>

      {/* === 3-COLUMN signature block (borderless table) === */}
      <table style={borderlessTableStyle}>
        <tbody>
          <tr>
            {/* LEFT: PIHAK KEDUA (receiver) */}
            <td style={{ width: "33%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>PIHAK KEDUA,</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {orDash(school?.receiverName)}
              </div>
              <div>Penerima Barang</div>
            </td>

            {/* CENTER: PEMERIKSA BARANG (goodsManager) */}
            <td style={{ width: "34%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
              <div>PEMERIKSA BARANG,</div>
              <div style={{ height: "64px" }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {orDash(school?.goodsManagerName)}
              </div>
              <div>Penata Muda</div>
              <div>NIP. {orDash(school?.goodsManagerNip)}</div>
            </td>

            {/* RIGHT: PIHAK PERTAMA (vendor) */}
            <td style={{ width: "33%", textAlign: "center", padding: "0 6px", verticalAlign: "top" }}>
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
    </div>
  );
}
