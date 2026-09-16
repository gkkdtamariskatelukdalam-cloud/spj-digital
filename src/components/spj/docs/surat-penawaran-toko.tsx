"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import { capitalize, orDash } from "./_helpers";

// ============================================================
// Toko — Surat Penawaran Toko / Penyedia
// ============================================================

interface SuratPenawaranTokoProps {
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
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "40px" }}>
                No
              </th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Uraian
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "70px" }}>
                Volume
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "90px" }}>
                Satuan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "130px" }}>
                Harga Satuan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "150px" }}>
                Jumlah
              </th>
            </tr>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>1</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>2</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>3</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>4</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>5</th>
              <th style={{ ...headerCellStyle, textAlign: "center" }}>6</th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    Rp {formatNumber(item.tarifHarga)}
                  </td>
                  <td style={{ ...cellStyle, textAlign: "right", fontWeight: 500 }}>
                    Rp {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === Total & Terbilang (below table, not in table) === */}
      <div className="mb-5 text-[12px] space-y-1">
        <div>
          <span className="font-semibold">Total Harga:</span>{" "}
          Rp {formatNumber(total)}
        </div>
        <div>
          <span className="font-semibold">Terbilang:</span>{" "}
          <span className="italic">{capitalize(terbilang(total))}</span>
        </div>
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
