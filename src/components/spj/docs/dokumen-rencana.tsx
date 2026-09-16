"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate } from "@/lib/format";
import { orDash, schoolAddress, schoolName } from "./_helpers";

// ============================================================
// 03RENCANA — Dokumen Perencanaan
// ============================================================

interface DokumenRencanaProps {
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

export function DokumenRencana({ group, school }: DokumenRencanaProps) {
  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === Title === */}
      <div className="text-center mb-5">
        <h1 className="font-bold uppercase text-[14px] underline underline-offset-4">
          DOKUMEN PERENCANAAN
        </h1>
      </div>

      {/* === Meta block === */}
      <div className="mb-4 space-y-1 text-[12px]">
        <div>
          <span className="font-semibold">Nama Satuan Pendidikan:</span>{" "}
          {schoolName(school)}
        </div>
        <div>
          <span className="font-semibold">Alamat Satuan Pendidikan:</span>{" "}
          {schoolAddress(school)}
        </div>
        <div>
          <span className="font-semibold">Kategori Barang/Jasa:</span> Alat
          Tulis Kantor (ATK)
        </div>
        <div>
          <span className="font-semibold">Jenis:</span> KETERANGAN
        </div>
        <div>
          <span className="font-semibold">Jumlah Barang/Jasa:</span>{" "}
          {group.itemCount}
        </div>
      </div>

      {/* === Spesifikasi table === */}
      <div className="mb-4">
        <div className="font-semibold text-[12px] mb-2">
          Spesifikasi/ruang lingkup barang/jasa:
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "32px" }}>
                ✓
              </th>
              <th style={{ ...headerCellStyle, textAlign: "center", width: "40px" }}>
                No
              </th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>
                Spesifikasi Barang/Jasa
              </th>
            </tr>
          </thead>
          <tbody>
            {group.items.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{ ...cellStyle, textAlign: "center", color: "#64748b" }}
                >
                  Tidak ada item.
                </td>
              </tr>
            ) : (
              group.items.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ ...cellStyle, textAlign: "center" }}>
                    ✓
                  </td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === Date & signature === */}
      <div className="flex justify-end mb-4 mt-6">
        <div className="text-right text-[12px]">
          <div>Telukdalam, {formatDate(group.tglPesan)}</div>
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
