"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import {
  buildSpjNumber,
  capitalize,
  orDash,
  pickGroupDate,
  schoolAddress,
  schoolName,
} from "./_helpers";

// ============================================================
// SPJ — Surat Pertanggungjawaban
// ============================================================

interface SuratPertanggungjawabanProps {
  group: DocumentGroup;
  school: School | null;
}

export function SuratPertanggungjawaban({
  group,
  school,
}: SuratPertanggungjawabanProps) {
  const total = group.totalJumlah;
  const docNumber = buildSpjNumber(group);
  const spjDate = pickGroupDate(group);

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
      <div className="text-center mb-4">
        <h1 className="font-bold uppercase text-[14px] underline underline-offset-4">
          SURAT PERTANGGUNGJAWABAN (SPJ)
        </h1>
        <p className="text-[12px] mt-1">
          Nomor: <span className="font-mono font-semibold">{docNumber}</span>
        </p>
      </div>

      {/* === Opening paragraph === */}
      <p className="text-justify mb-4">
        Setelah kami hitung dengan sebenarnya, maka jumlah pengeluaran yang
        dibebankan pada anggaran BOSP Tahun{" "}
        <span className="font-semibold">{group.tahun}</span> adalah sebagai
        berikut:
      </p>

      {/* === Items table === */}
      <div className="mb-3">
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
                Vol
              </th>
              <th className="border border-slate-800 px-2 py-1 text-center w-20">
                Satuan
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-28">
                Tarif (Rp)
              </th>
              <th className="border border-slate-800 px-2 py-1 text-right w-32">
                Jumlah (Rp)
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
                    {formatNumber(item.tarifHarga)}
                  </td>
                  <td className="border border-slate-800 px-2 py-1 text-right tabular-nums font-medium">
                    {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
            {/* Total row */}
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-800 px-2 py-1" colSpan={5}>
                JUMLAH TOTAL
              </td>
              <td className="border border-slate-800 px-2 py-1 text-right tabular-nums">
                {formatNumber(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Terbilang === */}
      <div className="mb-4 text-[12px]">
        <span className="font-semibold">Terbilang:</span>{" "}
        <span className="italic">{capitalize(terbilang(total))}</span>
      </div>

      {/* === Closing paragraph === */}
      <p className="text-justify text-[12px] mb-6">
        Demikian surat pertanggungjawaban ini dibuat dengan sebenarnya untuk
        dapat dipergunakan sebagai mestinya.
      </p>

      {/* === Date === */}
      <div className="flex justify-end mb-4">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(spjDate)}</div>
        </div>
      </div>

      {/* === Three-column signature block === */}
      <div className="grid grid-cols-3 gap-4 text-center text-[12px]">
        {/* Mengetahui - Kepala Sekolah */}
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
        {/* Bendahara */}
        <div>
          <div className="font-medium">Bendahara,</div>
          <div>Bendahara Pengeluaran</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(school?.treasurerName)}
          </div>
          <div className="text-[11px]">
            NIP. <span className="font-mono">{orDash(school?.treasurerNip)}</span>
          </div>
        </div>
        {/* Penerima (Vendor) */}
        <div>
          <div className="font-medium">Penerima,</div>
          <div className="h-16" />
          <div className="font-semibold underline underline-offset-4">
            {orDash(group.vendorOwner)}
          </div>
          <div className="text-[11px]">{orDash(group.vendorName)}</div>
        </div>
      </div>
    </div>
  );
}
