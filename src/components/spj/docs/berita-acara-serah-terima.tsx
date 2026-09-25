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
// Per-document page setup — Excel 05BAT sheet margins (cm):
//   L=0.80 R=0.80 T=1.50 B=0.80  scale=90%  portrait
import { PAGE_SETUP_05BAT as PAGE_SETUP } from "./_page-setup";
export { PAGE_SETUP };

// ============================================================
// 05BAT — Berita Acara Serah Terima
// Font sizes per Excel 05BAT:
//   - Title "BERITA ACARA SERAH TERIMA": 16pt bold
//   - Body (nomor surat s/d PIHAK PERTAMA menyerahkan...): 11pt
//   - Items table (No, Nama Barang, Diserahkan, Diterima, Kondisi): 10pt
//   - Signatures (PIHAK KEDUA, PIHAK PERTAMA): 11pt
// ============================================================

interface BeritaAcaraSerahTerimaProps {
  group: DocumentGroup;
  school: School | null;
}

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "4px 6px",
  verticalAlign: "top",
  fontSize: "10pt",
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
  fontSize: "11pt",
};
const nameStyle: CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
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

  const vendorName = orDash(group.vendorName);
  const vendorOwner = orDash(group.vendorOwner);
  const vendorAddress = orDash(group.vendorAddress);
  const vendorPhone = orDash(group.vendorPhone);
  const receiverName = orDash(school?.receiverName);
  const receiverPhone = orDash(school?.receiverPhone);

  const items = group.items.filter(
    (it) =>
      (it.namaBarang && it.namaBarang.trim()) ||
      (it.uraian && it.uraian.trim()),
  );

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[11pt] leading-relaxed text-slate-900">
      {/* === Kop Surat === */}
      <div className="mb-5">
        <Letterhead />
      </div>

      {/* === Title (16pt per Excel A9) === */}
      <div className="text-center mb-4">
        <h1 className="font-bold" style={{ fontSize: "16pt" }}>BERITA ACARA SERAH TERIMA</h1>
      </div>

      {/* === Nomor surat + body (11pt) === */}
      <div style={{ fontSize: "11pt" }}>
        <p className="text-center mb-4">NOMOR : {docNumber}</p>

        <p className="text-justify mb-3">
          Pada hari ini, <span className="font-semibold">{dayName}</span> tanggal{" "}
          <span className="font-semibold">{day}</span> bulan{" "}
          <span className="font-semibold">{monthName}</span> tahun{" "}
          <span className="font-semibold">{year}</span>, sesuai dengan :
        </p>

        {/* Info block */}
        <div className="mb-4">
          <table style={borderlessTableStyle}>
            <tbody>
              <tr>
                <td style={{ ...labelCellNoBorder, width: "210px" }}>Nomor Surat Pemesanan</td>
                <td style={labelCellNoBorder}>: {pesanNumber}</td>
              </tr>
              <tr>
                <td style={labelCellNoBorder}>Tanggal</td>
                <td style={labelCellNoBorder}>: {formatDate(tglPesan)}</td>
              </tr>
              <tr>
                <td style={labelCellNoBorder}>Nama pekerjaan</td>
                <td style={labelCellNoBorder}>: Pengadaan {group.items[0]?.uraianKwitansi || "Alat Tulis Kantor (ATK)"}</td>
              </tr>
              <tr>
                <td style={labelCellNoBorder}>Tahun</td>
                <td style={labelCellNoBorder}>: {group.tahun}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Yang bertandatangan */}
        <p className="font-bold mb-3">Yang bertandatangan di bawah ini:</p>

        {/* PIHAK PERTAMA — nomor "1" sejajar dengan teks */}
        <div className="mb-2">
          <table style={borderlessTableStyle}>
            <tbody>
              <tr>
                <td style={{ width: "30px", verticalAlign: "top", fontSize: "11pt", fontWeight: 700 }}>1.</td>
                <td style={{ verticalAlign: "top", fontSize: "11pt" }}>
                  <table style={borderlessTableStyle}>
                    <tbody>
                      <tr>
                        <td style={{ ...labelCellNoBorder, width: "180px" }}>Nama</td>
                        <td style={labelCellNoBorder}>: {vendorOwner}</td>
                      </tr>
                      <tr>
                        <td style={labelCellNoBorder}>Jabatan</td>
                        <td style={labelCellNoBorder}>: Direktur</td>
                      </tr>
                      <tr>
                        <td style={labelCellNoBorder}>Nama Penyedia</td>
                        <td style={labelCellNoBorder}>: {vendorName}</td>
                      </tr>
                      <tr>
                        <td style={labelCellNoBorder}>Alamat Penyedia</td>
                        <td style={labelCellNoBorder}>: {vendorAddress}</td>
                      </tr>
                      <tr>
                        <td style={labelCellNoBorder}>No. Telepon</td>
                        <td style={labelCellNoBorder}>: {vendorPhone}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style={{ width: "30px" }}></td>
                <td style={{ fontSize: "11pt", paddingTop: "4px", paddingBottom: "12px" }}>
                  Sebagai pihak yang menyerahkan, selanjutnya disebut <span className="font-bold">PIHAK PERTAMA</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* PIHAK KEDUA — nomor "2" sejajar dengan teks */}
        <div className="mb-2">
          <table style={borderlessTableStyle}>
            <tbody>
              <tr>
                <td style={{ width: "30px", verticalAlign: "top", fontSize: "11pt", fontWeight: 700 }}>2.</td>
                <td style={{ verticalAlign: "top", fontSize: "11pt" }}>
                  <table style={borderlessTableStyle}>
                    <tbody>
                      <tr>
                        <td style={{ ...labelCellNoBorder, width: "180px" }}>Nama</td>
                        <td style={labelCellNoBorder}>: {receiverName}</td>
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
                        <td style={labelCellNoBorder}>: {receiverPhone}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style={{ width: "30px" }}></td>
                <td style={{ fontSize: "11pt", paddingTop: "4px", paddingBottom: "12px" }}>
                  Sebagai pihak yang menerima, selanjutnya disebut <span className="font-bold">PIHAK KEDUA</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Serah terima paragraph */}
        <p className="text-justify mb-4">
          PIHAK PERTAMA menyerahkan hasil pekerjaan Pengadaan{" "}
          {group.items[0]?.uraianKwitansi || "Alat Tulis Kantor (ATK)"}{" "}
          kepada PIHAK KEDUA, dan PIHAK KEDUA telah menerima
          hasil pekerjaan tersebut dalam jumlah yang lengkap dan kondisi yang
          baik sesuai dengan rincian berikut:
        </p>
      </div>

      {/* === Items table (10pt per Excel rows 31+) === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Nama Barang/Jasa
              </th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Diserahkan</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Diterima</th>
              <th style={{ ...headerCellStyle, width: "80px" }}>Kondisi</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                    {item.namaBarang || item.uraian}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {formatNumber(item.volume)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {formatNumber(item.volume)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>Baik</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === Closing paragraphs (11pt) === */}
      <div style={{ fontSize: "11pt" }} className="mb-6">
        <p className="text-justify mb-2">
          Berita Acara Serah Terima ini berfungsi sebagai bukti serah terima
          hasil pekerjaan yang dilaksanakan oleh PIHAK PERTAMA kepada PIHAK
          KEDUA.
        </p>
        <p className="text-justify">
          Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya
          untuk dapat dipergunakan sebagaimana mestinya.
        </p>
      </div>

      {/* === 2-COLUMN signature block (11pt per Excel rows 107-114) === */}
      {/* Per Excel: PIHAK KEDUA on left (col B), PIHAK PERTAMA on right (col G) */}
      <table style={borderlessTableStyle}>
        <tbody>
          <tr>
            {/* LEFT: PIHAK KEDUA (receiver) */}
            <td style={{ width: "50%", textAlign: "center", padding: "0 6px", verticalAlign: "top", fontSize: "11pt" }}>
              <div>PIHAK KEDUA,</div>
              <div style={{ height: "64px" }} />
              <div style={nameStyle}>{receiverName}</div>
              <div>Penerima Barang</div>
            </td>

            {/* RIGHT: PIHAK PERTAMA (vendor) */}
            <td style={{ width: "50%", textAlign: "center", padding: "0 6px", verticalAlign: "top", fontSize: "11pt" }}>
              <div>PIHAK PERTAMA,</div>
              <div style={{ height: "64px" }} />
              <div style={nameStyle}>{vendorOwner}</div>
              <div>Direktur</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
