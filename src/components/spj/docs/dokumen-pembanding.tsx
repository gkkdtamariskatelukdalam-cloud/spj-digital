"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber } from "@/lib/format";
import { orDash, schoolName } from "./_helpers";

// ============================================================
// 02BANDING — Dokumen Hasil Pembanding
// ============================================================

interface DokumenPembandingProps {
  group: DocumentGroup;
  school: School | null;
}

export function DokumenPembanding({ group, school }: DokumenPembandingProps) {
  const vendorName = group.vendorName || "—";
  const tglPesan = group.tglPesan;
  const formattedDate = formatDate(tglPesan);

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Title === */}
      <div className="text-center mb-5">
        <h1 className="font-bold uppercase text-[14px] underline underline-offset-4">
          DOKUMEN HASIL PEMBANDING
        </h1>
      </div>

      {/* === Meta block === */}
      <div className="mb-4 space-y-1 text-[12px]">
        <div>
          <span className="font-semibold">Satuan Pendidikan:</span>{" "}
          {schoolName(school)}
        </div>
        <div>
          <span className="font-semibold">Hasil pembanding:</span> Tercapai
          kesepakatan pembelian dengan {vendorName}
        </div>
        <div>
          <span className="font-semibold">Tanggal:</span> {formattedDate}
        </div>
      </div>

      {/* === Comparison table === */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-slate-800 text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-800 px-2 py-1 text-center w-10">
                No
              </th>
              <th className="border border-slate-800 px-2 py-1 text-left">
                Produk ({vendorName})
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-40">
                Estimasi Harga
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-slate-800 px-2 py-3 text-center text-slate-500">
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
                    <div className="font-medium">
                      {item.namaBarang || item.uraian}
                    </div>
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-right tabular-nums">
                    Rp {formatNumber(item.tarifHarga)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === Catatan === */}
      <p className="text-justify text-[12px] mb-6">
        Catatan: Harga terbaik dipilih berdasarkan perbandingan harga dari
        beberapa penyedia.
      </p>

      {/* === Date & signature === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formattedDate}</div>
        </div>
      </div>

      <div className="flex justify-center text-center text-[12px]">
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
      </div>
    </div>
  );
}
