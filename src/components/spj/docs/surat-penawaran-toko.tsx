"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import { capitalize, groupRomanMonth, orDash } from "./_helpers";

// ============================================================
// Toko — Surat Penawaran Toko / Penyedia
// Uses VENDOR letterhead (no school KOP).
// ============================================================

interface SuratPenawaranTokoProps {
  group: DocumentGroup;
  school: School | null;
}

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "4px 6px",
  verticalAlign: "top",
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

export function SuratPenawaranToko({ group, school }: SuratPenawaranTokoProps) {
  const vendorName = orDash(group.vendorName);
  const vendorAddress = orDash(group.vendorAddress);
  const vendorOwner = orDash(group.vendorOwner);
  const tglPesan = group.tglPesan;
  const total = group.totalJumlah;
  const romanMonth = groupRomanMonth(group);
  const docNumber = `421.3/${group.noPesan || "—"}-P/DB/SMANSATLD/${romanMonth}/${group.tahun}`;

  // School name from prop or default; only used for the recipient address
  const schoolNameStr = school?.name ?? "SMA Negeri 1 Telukdalam";

  return (
    <div className="spj-doc px-6 sm:px-10 py-8 text-[12px] leading-relaxed text-slate-900">
      {/* === VENDOR Letterhead === */}
      <div className="text-center mb-2">
        <div
          className="font-bold uppercase"
          style={{ fontSize: "26px", letterSpacing: "1px" }}
        >
          {vendorName}
        </div>
        <div style={{ fontSize: "11px", marginTop: "2px" }}>{vendorAddress}</div>
        <div
          style={{
            borderTop: "3px solid #000",
            marginTop: "6px",
          }}
        />
      </div>

      {/* === Right-aligned date === */}
      <div className="text-right mb-4 text-[12px]">
        Telukdalam, {formatDate(tglPesan)}
      </div>

      {/* === Recipient (left-aligned) === */}
      <div className="mb-4 text-[12px] leading-relaxed">
        <div>Kepada Yth.</div>
        <div>Kepala {schoolNameStr}</div>
        <div>Cq. Penanggungjawab Kegiatan</div>
        <div>di</div>
        <div style={{ paddingLeft: "24px" }}>Tempat</div>
      </div>

      {/* === Subject (bold) === */}
      <div className="mb-3 text-[12px] font-bold">Perihal : Pesanan Barang</div>

      {/* === Greeting + body === */}
      <p className="text-justify mb-5 text-[12px] leading-relaxed">
        Dengan hormat,
        <br />
        Memenuhi maksud surat permohonan Ibu kepada kami untuk menyediakan Alat
        Tulis Kantor (ATK) sesuai dengan pesanan Nomor: {docNumber}, Tanggal{" "}
        {formatDate(tglPesan)}, bersama ini kami bersedia untuk mengadakannya.
        Bon faktur turut terlampir. Demikian, atas perhatian diucapkan terima
        kasih.
      </p>

      {/* === Right-aligned signature === */}
      <div className="text-right mb-2 text-[12px]">
        <div className="font-bold uppercase">{vendorName}</div>
        <div style={{ height: "56px" }} />
        <div style={{ fontWeight: 700, textDecoration: "underline" }}>
          {vendorOwner}
        </div>
        <div>Direktur</div>
      </div>

      {/* === PAGE BREAK === */}
      <div style={{ pageBreakAfter: "always" }} />

      {/* === Second page: DAFTAR KUANTITAS DAN HARGA === */}
      <div className="text-center mb-4">
        <h1
          className="font-bold uppercase"
          style={{ fontSize: "14px", textDecoration: "underline" }}
        >
          DAFTAR KUANTITAS DAN HARGA
        </h1>
        <div
          style={{
            borderTop: "3px solid #000",
            marginTop: "6px",
            width: "60%",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
      </div>

      {/* === Items table with 2-row header === */}
      <div className="mb-4">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, width: "40px" }}>No</th>
              <th style={{ ...headerCellStyle, textAlign: "left" }}>Uraian</th>
              <th style={{ ...headerCellStyle, width: "70px" }}>Volume</th>
              <th style={{ ...headerCellStyle, width: "90px" }}>Satuan</th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "130px" }}>
                Harga Satuan
              </th>
              <th style={{ ...headerCellStyle, textAlign: "right", width: "150px" }}>
                Jumlah
              </th>
            </tr>
            <tr>
              <th style={headerCellStyle}>1</th>
              <th style={headerCellStyle}>2</th>
              <th style={headerCellStyle}>3</th>
              <th style={headerCellStyle}>4</th>
              <th style={headerCellStyle}>5</th>
              <th style={headerCellStyle}>6</th>
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
                    <div className="font-medium">{item.namaBarang || item.uraian}</div>
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
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    Rp {formatNumber(item.jumlah)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === Total & Terbilang (OUTSIDE table, right-aligned) === */}
      <div className="mb-5 text-[12px] text-right space-y-1">
        <div className="font-bold">
          Total Harga : Rp {formatNumber(total)}
        </div>
        <div className="italic">
          Terbilang : {capitalize(terbilang(total))}
        </div>
      </div>

      {/* === Final right-aligned signature === */}
      <div className="text-right text-[12px]">
        <div>Telukdalam, {formatDate(tglPesan)}</div>
        <div className="font-bold uppercase mt-1">{vendorName}</div>
        <div style={{ height: "56px" }} />
        <div style={{ fontWeight: 700, textDecoration: "underline" }}>
          {vendorOwner}
        </div>
        <div>Direktur</div>
      </div>
    </div>
  );
}
