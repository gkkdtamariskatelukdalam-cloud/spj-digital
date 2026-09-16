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

export function BeritaAcaraSerahTerima({
  group,
  school,
}: BeritaAcaraSerahTerimaProps) {
  const tglPesan = group.tglPesan;
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-BAST/SMANSA-TD/${romanMonth}/${group.tahun}`;
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
          BERITA ACARA SERAH TERIMA
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
            421.3/{group.noPesan || "—"}-P/SMANSA-TD/{romanMonth}/{group.tahun}
          </span>
        </li>
        <li>Tanggal: {formatDate(tglPesan)}</li>
        <li>Nama pekerjaan: Pengadaan Alat Tulis Kantor (ATK)</li>
        <li>Tahun: {group.tahun}</li>
      </ul>

      <p className="text-justify mb-4">
        Yang bertandatangan di bawah ini:
      </p>

      {/* === Party 1 === */}
      <ol className="list-decimal pl-6 mb-4 space-y-2 text-[12px]">
        <li>
          <div>
            Nama:{" "}
            <span className="font-semibold">
              {orDash(group.vendorOwner)}
            </span>
          </div>
          <div>Jabatan: Direktur</div>
          <div>Nama Penyedia: {orDash(group.vendorName)}</div>
          <div>Alamat Penyedia: {orDash(group.vendorAddress)}</div>
          <div>No. Telepon: {orDash(group.vendorPhone)}</div>
          <div className="italic">
            Sebagai pihak yang menyerahkan, selanjutnya disebut PIHAK PERTAMA
          </div>
        </li>
        <li>
          <div>
            Nama:{" "}
            <span className="font-semibold">
              {orDash(school?.receiverName)}
            </span>
          </div>
          <div>Jabatan: Penerima Barang</div>
          <div>
            Nama Satuan Pendidikan:{" "}
            <span className="uppercase">{schoolName(school)}</span>
          </div>
          <div>Alamat Satuan Pendidikan: {schoolAddress(school)}</div>
          <div>No. Telepon: {orDash(school?.receiverPhone)}</div>
          <div className="italic">
            Sebagai pihak yang menerima, selanjutnya disebut PIHAK KEDUA
          </div>
        </li>
      </ol>

      <p className="text-justify mb-3">
        PIHAK PERTAMA menyerahkan hasil pekerjaan Pengadaan Alat Tulis Kantor
        (ATK) kepada PIHAK KEDUA dengan rincian:
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
              <th style={{ ...headerCellStyle, textAlign: "center", width: "100px" }}>
                Diserahkan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "100px" }}>
                Diterima
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
                    {formatNumber(item.volume)} {item.satuan ?? ""}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    {formatNumber(item.volume)} {item.satuan ?? ""}
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
        Demikian berita acara serah terima ini dibuat untuk dapat dipergunakan
        sebagaimana mestinya.
      </p>

      {/* === Date & signatures === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(tglPesan)}</div>
        </div>
      </div>

      {/* 2-column top: PIHAK PERTAMA / PIHAK KEDUA */}
      <div className="grid grid-cols-2 gap-8 text-center text-[12px]">
        <div>
          <div className="font-medium">PIHAK PERTAMA,</div>
          <div className="h-20" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(group.vendorOwner)}
          </div>
          <div>{orDash(group.vendorName)}</div>
          <div>Direktur</div>
        </div>
        <div>
          <div className="font-medium">PIHAK KEDUA,</div>
          <div className="h-20" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.receiverName)}
          </div>
          <div>Penerima Barang</div>
        </div>
      </div>

      {/* Bottom centered: Pemeriksa Barang */}
      <div className="mt-8 flex justify-center text-center text-[12px]">
        <div>
          <div className="font-medium">Pemeriksa Barang,</div>
          <div className="h-20" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.goodsManagerName)}
          </div>
          <div className="text-[11px]">
            NIP.{" "}
            <span className="font-mono">{orDash(school?.goodsManagerNip)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
