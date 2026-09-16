"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber } from "@/lib/format";
import { orDash } from "./_helpers";

// ============================================================
// Toko — Surat Penawaran Toko / Penyedia
// ============================================================

interface SuratPenawaranTokoProps {
  group: DocumentGroup;
  school: School | null;
}

export function SuratPenawaranToko({ group, school }: SuratPenawaranTokoProps) {
  const vendorName = group.vendorName || "—";
  const vendorAddress = group.vendorAddress || "—";
  const vendorOwner = group.vendorOwner || "—";
  const tglPesan = group.tglPesan;
  const total = group.totalJumlah;

  // School name from prop or default; we only need it for the recipient address
  const schoolName = school?.name ?? "SMA Negeri 1 Telukdalam";

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Letterhead (vendor) === */}
      <div className="mb-4">
        <div className="font-bold uppercase text-[14px]">{vendorName}</div>
        <div className="text-[11px]">{vendorAddress}</div>
      </div>

      {/* === Date === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(tglPesan)}</div>
        </div>
      </div>

      {/* === Recipient === */}
      <div className="mb-4 text-[12px]">
        <div>Kepada Yth.</div>
        <div>Kepala {schoolName}</div>
        <div>Cq. Penanggungjawab Kegiatan</div>
        <div>di Tempat</div>
      </div>

      {/* === Subject & greeting === */}
      <div className="mb-3 text-[12px]">
        <span className="font-semibold">Perihal: Pesanan Barang</span>
      </div>
      <p className="text-justify mb-4 text-[12px]">
        Dengan hormat, Memenuhi maksud surat permohonan Ibu kepada kami untuk
        menyediakan Alat Tulis Kantor (ATK), maka berikut ini kami sampaikan
        daftar kuantitas dan harga:
      </p>

      {/* === Items table === */}
      <div className="mb-4">
        <div className="font-semibold text-[12px] mb-2">
          DAFTAR KUANTITAS DAN HARGA
        </div>
        <table className="w-full border-collapse border border-slate-800 text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-800 px-2 py-1 text-center w-10">
                No
              </th>
              <th className="border border-slate-800 px-2 py-1 text-left">
                Uraian
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-16">
                Volume
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-20">
                Satuan
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-28">
                Harga Satuan
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-32">
                Jumlah
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

      {/* === Signature === */}
      <div className="flex justify-end mt-6">
        <div className="text-center text-[12px]">
          <div className="font-semibold uppercase">{vendorName}</div>
          <div className="h-20" />
          <div className="font-semibold underline underline-offset-4">
            {vendorOwner}
          </div>
          <div>Direktur</div>
        </div>
      </div>
    </div>
  );
}
