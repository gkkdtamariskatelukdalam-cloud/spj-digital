"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, getMonthName } from "@/lib/format";
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
      <header className="text-center border-b-2 border-slate-800 pb-3 mb-5">
        <div className="font-bold uppercase text-[13px] tracking-wide">
          PEMERINTAH PROVINSI SUMATERA UTARA
        </div>
        <div className="font-bold uppercase text-[13px] tracking-wide">
          DINAS PENDIDIKAN
        </div>
        <div className="font-bold uppercase text-[14px] tracking-wide">
          {schoolName(school)}
        </div>
        <div className="text-[11px] mt-1">{schoolAddress(school)}</div>
      </header>

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
        <table className="w-full border-collapse border border-slate-800 text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-800 px-2 py-1 text-center w-10">
                No
              </th>
              <th className="border border-slate-800 px-2 py-1 text-left">
                Nama Barang/Jasa
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-20">
                Diserahkan
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-20">
                Diterima
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-20">
                Kondisi
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-slate-800 px-2 py-3 text-center text-slate-500">
                  Tidak ada item.
                </td>
              </tr>
            ) : (
              group.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="border border-slate-800 px-2 py-1 text-center tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-800 px-2 py-1">
                    <div className="font-medium">{item.uraian}</div>
                    {item.namaBarang && (
                      <div className="text-[10px] italic text-slate-600">
                        {item.namaBarang}
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-center tabular-nums">
                    {formatNumber(item.volume)} {item.satuan ?? ""}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-center tabular-nums">
                    {formatNumber(item.volume)} {item.satuan ?? ""}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-center">
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
    </div>
  );
}
