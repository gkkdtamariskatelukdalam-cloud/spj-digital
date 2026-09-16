"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import {
  capitalize,
  estimateCompletionDate,
  groupRomanMonth,
  orDash,
  schoolAddress,
  schoolName,
} from "./_helpers";

// ============================================================
// 01PESAN — Surat Pesanan
// ============================================================

interface SuratPesananProps {
  group: DocumentGroup;
  school: School | null;
}

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
        <div className="text-[11px] mt-1">
          {schoolAddress(school)}
        </div>
        <div className="text-[11px]">
          Cabdisdik Wil. XIV, Kode Pos 22865
        </div>
        <div className="text-[11px]">
          Telp/HP: 081370904506, Pos-el: smansatelukdalam1987@gmail.com
        </div>
        <div className="text-[11px]">
          Laman: smansatelukdalam.sch.id
        </div>
      </header>

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
        <table className="w-full border-collapse border border-slate-800 text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-800 px-2 py-1 text-center w-10">
                No
              </th>
              <th className="border border-slate-800 px-2 py-1 text-left">
                Uraian Barang / Jasa
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-16">
                Jumlah
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-20">
                Satuan
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-28">
                Harga Satuan
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-32">
                Total Harga
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-slate-800 px-2 py-3 text-center text-slate-500">
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
                    {formatNumber(item.volume)}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-center">
                    {orDash(item.satuan)}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-right tabular-nums">
                    Rp {formatNumber(item.tarifHarga)}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-right tabular-nums font-medium">
                    Rp {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
            {/* Total row */}
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-800 px-2 py-1" colSpan={5}>
                JUMLAH
              </td>
              <td className="border border-slate-800 px-2 py-1 text-right tabular-nums">
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
