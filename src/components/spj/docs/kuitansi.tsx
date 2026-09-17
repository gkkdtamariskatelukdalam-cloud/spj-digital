"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatRupiah, terbilang } from "@/lib/format";
import { toRoman, titleCase } from "@/components/spj/docs/_helpers";

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "1px solid #000",
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "4px 8px",
  fontSize: "12px",
};

const nameStyle: React.CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
};

const borderlessTableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "none",
};

// Body label column: right-aligned, fixed width so all ':' align
const bodyLabelStyle: React.CSSProperties = {
  width: "40%",
  textAlign: "right",
  padding: "1px 4px",
  fontSize: "12px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
};

const bodyValueStyle: React.CSSProperties = {
  padding: "1px 4px",
  fontSize: "12px",
  verticalAlign: "top",
};

export function Kuitansi({
  group,
  school,
}: {
  group: DocumentGroup;
  school: School | null;
}) {
  const total = group.totalJumlah || 0;
  const tglBayar = group.tglBayar;
  const noPesan = group.noPesan || "";
  const noBku = group.noBku || group.bpuCode || "";
  const vendorName = group.vendorName || "—";
  const vendorOwner = group.vendorOwner || "—";

  // School officials
  const principalName = school?.principalName || "—";
  const principalNip = school?.principalNip || "—";
  const principalRank = school?.principalRank || "Pembina Tk I";
  const treasurerName = school?.treasurerName || "—";
  const treasurerNip = school?.treasurerNip || "—";
  const treasurerRank = school?.treasurerRank || "Penata TK. I";
  const goodsManagerName = school?.goodsManagerName || "—";
  const goodsManagerNip = school?.goodsManagerNip || "—";
  const goodsManagerRank = school?.goodsManagerRank || "Penata Muda";

  // First item uraian for "Untuk pembayaran"
  const firstUraian = group.items[0]?.uraian || "Pengadaan ATK";

  // Nomor surat
  const romanMonth = toRoman(group.bulan || 1);
  const tahun = group.tahun || 2025;
  const nomorSurat = `421.3/${noPesan}-P/DB/SMANSATLD/${romanMonth}/${tahun}`;

  // Terbilang
  const terbilangText = titleCase(terbilang(total));

  return (
    <div
      className="spj-doc"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "12px",
        lineHeight: 1.5,
        padding: "2rem 2.5rem",
        color: "#000",
      }}
    >
      {/* === INFO TABLE (with borders, 4 columns) === */}
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={cellStyle}>Sumber Anggaran : Dana BOSP {tahun}</td>
            <td style={cellStyle}>Program : -</td>
          </tr>
          <tr>
            <td style={cellStyle}>Kas/Pos Tanggal : {tglBayar ? formatDate(tglBayar) : "—"}</td>
            <td style={cellStyle}>Kegiatan : -</td>
          </tr>
          <tr>
            <td style={cellStyle}>Nomor : {noBku || "—"}</td>
            <td style={cellStyle}>Kode Rek : -</td>
          </tr>
        </tbody>
      </table>

      {/* === TITLE (centered, bold, underlined) === */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "14px",
          textDecoration: "underline",
          margin: "16px 0 12px 0",
        }}
      >
        TANDA PEMBAYARAN
      </div>

      {/* === BODY BLOCK - rata kiri, ':' sejajar === */}
      <div style={{ fontSize: "12px", lineHeight: 1.8, marginBottom: "16px" }}>
        <div><span style={{ display: "inline-block", width: "170px" }}>Sudah terima dari</span>: Bendahara SMA Negeri 1 Telukdalam</div>
        <div><span style={{ display: "inline-block", width: "170px" }}>Uang sebesar</span>: <span style={{ fontWeight: 700 }}>{formatRupiah(total)}</span></div>
        <div><span style={{ display: "inline-block", width: "170px" }}>Terbilang</span>: <span style={{ fontStyle: "italic", fontWeight: 700 }}>{terbilangText}</span></div>
        <div>Nomor Surat persetujuan penyediaan barang</div>
        <div><span style={{ display: "inline-block", width: "170px" }}>dan jasa</span>: {nomorSurat}</div>
        <div><span style={{ display: "inline-block", width: "170px" }}>Untuk pembayaran</span>: {firstUraian}</div>
      </div>

      {/* === 3-COLUMN SIGNATURE TABLE (borderless) === */}
      <table style={borderlessTableStyle}>
        <tbody>
          <tr>
            {/* Kolom 1: Mengetahui / Pengurus Barang */}
            <td
              style={{
                width: "33%",
                textAlign: "left",
                verticalAlign: "top",
                padding: "8px 8px 0 0",
                fontSize: "12px",
              }}
            >
              <div>Mengetahui :</div>
              <div>Pengurus Barang</div>
              <div style={{ height: "56px" }} />
              <div style={nameStyle}>{goodsManagerName}</div>
              <div>{goodsManagerRank}</div>
              <div>NIP. {goodsManagerNip}</div>
            </td>
            {/* Kolom 2: Lunas Bayar Oleh / Bendahara */}
            <td
              style={{
                width: "34%",
                textAlign: "left",
                verticalAlign: "top",
                padding: "8px 8px 0 8px",
                fontSize: "12px",
              }}
            >
              <div>Lunas Bayar Oleh :</div>
              <div>Bendahara SMA Negeri 1 Telukdalam</div>
              <div style={{ height: "56px" }} />
              <div style={nameStyle}>{treasurerName}</div>
              <div>{treasurerRank}</div>
              <div>NIP. {treasurerNip}</div>
            </td>
            {/* Kolom 3: Diterima oleh / Vendor */}
            <td
              style={{
                width: "33%",
                textAlign: "left",
                verticalAlign: "top",
                padding: "8px 0 0 8px",
                fontSize: "12px",
              }}
            >
              <div>Diterima oleh :</div>
              <div>{vendorName}</div>
              <div style={{ height: "56px" }} />
              <div style={nameStyle}>{vendorOwner}</div>
              <div>Direktur</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* === Menyetujui block (centered, below 3 columns) === */}
      <div
        style={{
          textAlign: "center",
          marginTop: "24px",
          fontSize: "12px",
        }}
      >
        <div>Menyetujui :</div>
        <div>Kepala Sekolah SMA Negeri 1 Telukdalam</div>
        <div style={{ height: "56px" }} />
        <div style={nameStyle}>{principalName}</div>
        <div>{principalRank}</div>
        <div>NIP. {principalNip}</div>
      </div>
    </div>
  );
}
