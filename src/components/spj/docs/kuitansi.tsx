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
  verticalAlign: "top",
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

// === Info-block styles (4-column table with aligned colons) ===
// Label cells: right-aligned + fixed width so the trailing ':' lines up
// vertically across rows regardless of label length.
const infoLabelStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "right",
  whiteSpace: "nowrap",
  width: "18%", // fixed width → colons align
  padding: "3px 6px",
};
const infoColonStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "center",
  width: "2%",
  padding: "3px 4px",
};
const infoValueStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "left",
  width: "30%",
  padding: "3px 6px",
  whiteSpace: "nowrap",
};
// Right-side label (Program/Kegiatan/Kode Rek) — slightly narrower column
const infoLabelRightStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "right",
  whiteSpace: "nowrap",
  width: "12%",
  padding: "3px 6px",
};
const infoValueRightStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "left",
  width: "38%",
  padding: "3px 6px",
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

  // === Info-block fields (synced to kodeProgram / kodeRekening data) ===
  // Per Excel 01PESAN sheet rows 118-120:
  //   - Sumber Anggaran : "Dana BOSP {tahun}"
  //   - Program         : 2-segment prefix of kodeProgram (e.g. "06. 05")
  //   - Kas/Pos Tanggal : formatDate(tglBayar)
  //   - Kegiatan        : full kodeProgram (e.g. "06. 05. 08.")
  //   - Nomor           : noBku
  //   - Kode Rek        : kodeRekening (e.g. "5.1.02.01.01.0024")
  //
  // The source Excel labels col D as "Kode Program" but its content is
  // actually a 3-segment Kegiatan code. We therefore split it: the first
  // two dot-separated segments become "Program", the full string becomes
  // "Kegiatan". Falls back to "—" when kodeProgram is empty.
  const kodeProgramFull = (group.kodeProgram || "").trim();
  const kodeProgramSegments = kodeProgramFull
    .split(".")
    .map((s) => s.trim())
    .filter(Boolean);
  const programDisplay =
    kodeProgramSegments.length >= 2
      ? `${kodeProgramSegments[0]}. ${kodeProgramSegments[1]}`
      : kodeProgramFull || "—";
  const kegiatanDisplay = kodeProgramFull || "—";
  const kodeRekDisplay = (group.kodeRekening || "").trim() || "—";
  const sumberAnggaranDisplay = `Dana BOSP ${tahun}`;

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
      {/* === INFO TABLE (4 columns, all cells bordered, ':' aligned) === */}
      {/* Layout per row: [label1][colon][value1][label2][colon][value2]
          Label cells are right-aligned with fixed width so the ':' columns
          line up vertically across rows. */}
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={infoLabelStyle}>Sumber Anggaran</td>
            <td style={infoColonStyle}>:</td>
            <td style={infoValueStyle}>{sumberAnggaranDisplay}</td>
            <td style={infoLabelRightStyle}>Program</td>
            <td style={infoColonStyle}>:</td>
            <td style={infoValueRightStyle}>{programDisplay}</td>
          </tr>
          <tr>
            <td style={infoLabelStyle}>Kas/Pos Tanggal</td>
            <td style={infoColonStyle}>:</td>
            <td style={infoValueStyle}>
              {tglBayar ? formatDate(tglBayar) : "—"}
            </td>
            <td style={infoLabelRightStyle}>Kegiatan</td>
            <td style={infoColonStyle}>:</td>
            <td style={infoValueRightStyle}>{kegiatanDisplay}</td>
          </tr>
          <tr>
            <td style={infoLabelStyle}>Nomor</td>
            <td style={infoColonStyle}>:</td>
            <td style={infoValueStyle}>{noBku || "—"}</td>
            <td style={infoLabelRightStyle}>Kode Rek</td>
            <td style={infoColonStyle}>:</td>
            <td style={infoValueRightStyle}>{kodeRekDisplay}</td>
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
