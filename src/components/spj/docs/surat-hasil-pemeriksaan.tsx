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

export function SuratHasilPemeriksaan({
  group,
  school,
}: SuratHasilPemeriksaanProps) {
  const tglPesan = group.tglPesan;
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-PB/SMANSA-TD/${romanMonth}/${group.tahun}`;
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
      <div className="text-center mb-5">
        <h1 className="font-bold uppercase text-[14px] underline underline-offset-4">
          SURAT HASIL PEMERIKSAAN
        </h1>
        <p className="text-[12px] mt-1">
          NOMOR: <span className="font-mono">{docNumber}</span>
        </p>
      </div>

      {/* === Opening paragraph === */}
      <p className="text-justify mb-4">
        Pada hari ini, <span className="font-semibold">{dayName}</span> tanggal{" "}
        <span className="font-semibold">{day}</span> bulan{" "}
        <span className="font-semibold">{monthName}</span> tahun{" "}
        <span className="font-semibold">{year}</span>, sesuai dengan:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-0.5 text-[12px]">
        <li>
          Nomor Surat Pemesanan:{" "}
          <span className="font-mono">
            421.3/{group.noPesan || "—"}-P/DB/SMANSATLD/{romanMonth}/{group.tahun}
          </span>
        </li>
        <li>Tanggal: {formatDate(tglPesan)}</li>
        <li>Nama pekerjaan: Pengadaan Alat Tulis Kantor (ATK)</li>
        <li>Tahun: {group.tahun}</li>
      </ul>

      <p className="text-justify mb-4">
        Yang bertandatangan di bawah ini:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-0.5 text-[12px]">
        <li>
          Nama:{" "}
          <span className="font-semibold">
            {orDash(school?.receiverName)}
          </span>
        </li>
        <li>Jabatan: Penerima Barang</li>
        <li>
          Nama Satuan Pendidikan:{" "}
          <span className="uppercase">{schoolName(school)}</span>
        </li>
        <li>Alamat: {schoolAddress(school)}</li>
        <li>No. Telepon: {orDash(school?.receiverPhone)}</li>
      </ul>

      <p className="text-justify mb-3">
        Telah melakukan pemeriksaan terhadap hasil pekerjaan sesuai surat
        pemesanan di atas, dengan hasil:
      </p>

      {/* === Items table === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "40px" }}>
                No
              </th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Nama Barang/Jasa
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "70px" }}>
                Jumlah
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "90px" }}>
                Satuan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "90px" }}>
                Kondisi
              </th>
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
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    Baik
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-justify text-[12px] mb-6">
        Demikian surat hasil pemeriksaan ini dibuat untuk dapat dipergunakan
        sebagaimana mestinya.
      </p>

      {/* === Date & signature === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(tglPesan)}</div>
        </div>
      </div>

      <div className="flex justify-center text-center text-[12px]">
        <div>
          <div className="font-medium">Pemeriksa,</div>
          <div>Penerima Barang</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.receiverName)}
          </div>
        </div>
      </div>
    </div>
  );
}
