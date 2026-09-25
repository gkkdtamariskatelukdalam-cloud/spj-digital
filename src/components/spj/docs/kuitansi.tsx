"use client";

import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate, formatNumber, terbilang } from "@/lib/format";
import { toRoman, titleCase } from "@/components/spj/docs/_helpers";
// Per-document page setup — Kuitansi has no matching Excel sheet;
// use a sensible default (1cm all sides, portrait, no scaling).
import { PAGE_SETUP_KUITANSI as PAGE_SETUP } from "./_page-setup";
export { PAGE_SETUP };

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "1px solid #000",
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "4px 8px",
  fontSize: "10pt",
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

// === Info-block styles (matches PDF layout) ===
// Per PDF: 2 cells per row (left half + right half), each cell contains
// the full "Label : Value" string with NO internal border between label
// and value. The vertical divider between left and right halves is
// naturally created by the cell borders. Labels are left-aligned.
//
// Layout (2 cells per row):
//   [L-label : L-value (50%)] | [R-label : R-value (50%)]
//
// To align the colons across rows despite varying label lengths, the
// label text + colon are wrapped in an inline-flex container with
// justify-content: space-between. The label text sits at the LEFT edge
// of the fixed-width container (rata kiri), and the colon is pushed to
// the RIGHT edge — matching the PDF layout where "Sumber Anggaran :"
// and "Nomor           :" both have the colon at the same x position.
const infoCellLeftStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "left",
  width: "50%",
  padding: "3px 8px",
  verticalAlign: "top",
};
const infoCellRightStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "left",
  width: "50%",
  padding: "3px 8px",
  verticalAlign: "top",
};
// Inline-flex container: label text on the LEFT, colon on the RIGHT
// → colons line up across rows because they all land at the right edge
// of this fixed-width container.
const infoLabelTextStyle: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  // Width chosen to fit the longest left-side label "Sumber Anggaran"
  // (16 chars) — keeps colons aligned across rows for both halves.
  width: "150px",
  whiteSpace: "nowrap",
};
const infoLabelRightTextStyle: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  // Width chosen to fit the longest right-side label "Kode Rek"
  width: "90px",
  whiteSpace: "nowrap",
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

  // Kolom Y (Uraian Kwitansi) — dipakai untuk "Untuk pembayaran: Pengadaan [Y]"
  // Diawali dengan kata "Pengadaan" lalu diikuti oleh isi kolom Y.
  const firstUraian = group.items[0]?.uraianKwitansi
    ? `Pengadaan ${group.items[0].uraianKwitansi}`
    : group.items[0]?.uraian || "Pengadaan ATK";

  // Nomor surat
  const romanMonth = toRoman(group.bulan || 1);
  const tahun = group.tahun || 2025;
  const nomorSurat = `421.3/${noPesan}-P/DB/SMANSATLD/${romanMonth}/${tahun}`;

  // Terbilang (Title Case per spec)
  const terbilangText = titleCase(terbilang(total));

  // === Info-block fields (synced to kodeProgram / kodeRekening data) ===
  // Per Excel 01PESAN sheet rows 118-120 + PDF output:
  //   - Sumber Anggaran : "Dana BOSP {tahun}"
  //   - Program         : 2-segment prefix of kodeProgram (e.g. "06. 05")
  //   - Kas/Pos Tanggal : formatDate(tglBayar)
  //   - Kegiatan        : full kodeProgram (e.g. "06. 05. 09.")
  //   - Nomor           : noBku
  //   - Kode Rek        : kodeRekening (e.g. "5.1.02.01.01.0030")
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

  // === Body-block styles (matches PDF layout) ===
  // Per PDF:
  //   - Each body row has a label (right-aligned, fixed width) followed
  //     by " : " and the value.
  //   - Labels include "Sudah terima dari", "Uang sebesar", "Terbilang",
  //     "dan jasa" (continuation line), "Untuk pembayaran".
  //   - "Nomor Surat persetujuan penyediaan barang" is on its own line
  //     (no colon), then "dan jasa : {nomorSurat}" on the next line.
  //   - "Uang sebesar" value: "Rp" + spaces + amount (we use single space).
  //   - "Terbilang" value: italic + bold.
  const bodyLabelStyle: React.CSSProperties = {
    display: "inline-block",
    width: "170px",
    textAlign: "left",
  };

  return (
    <div
      className="spj-doc"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "10pt",
        lineHeight: 1.5,
        padding: "2rem 2.5rem",
        color: "#000",
      }}
    >
      {/* === INFO TABLE (2 cells per row, all cells bordered, labels left-aligned) === */}
      {/* Per PDF: each row has 2 cells (left half + right half). Each cell
          contains the full "Label : Value" string. The vertical divider
          between halves is naturally created by the cell borders.
          The label text + colon are wrapped in an inline-flex container
          with justify-content: space-between so the label text sits at
          the LEFT edge (rata kiri) while the colon is pushed to the RIGHT
          edge of the fixed-width container — colons align across rows. */}
      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={infoCellLeftStyle}>
              <span style={infoLabelTextStyle}>
                <span>Sumber Anggaran</span>
                <span>:</span>
              </span>
              {" "}
              {sumberAnggaranDisplay}
            </td>
            <td style={infoCellRightStyle}>
              <span style={infoLabelRightTextStyle}>
                <span>Program</span>
                <span>:</span>
              </span>
              {" "}
              {programDisplay}
            </td>
          </tr>
          <tr>
            <td style={infoCellLeftStyle}>
              <span style={infoLabelTextStyle}>
                <span>Kas/Pos Tanggal</span>
                <span>:</span>
              </span>
              {" "}
              {tglBayar ? formatDate(tglBayar) : "—"}
            </td>
            <td style={infoCellRightStyle}>
              <span style={infoLabelRightTextStyle}>
                <span>Kegiatan</span>
                <span>:</span>
              </span>
              {" "}
              {kegiatanDisplay}
            </td>
          </tr>
          <tr>
            <td style={infoCellLeftStyle}>
              <span style={infoLabelTextStyle}>
                <span>Nomor</span>
                <span>:</span>
              </span>
              {" "}
              {noBku || "—"}
            </td>
            <td style={infoCellRightStyle}>
              <span style={infoLabelRightTextStyle}>
                <span>Kode Rek</span>
                <span>:</span>
              </span>
              {" "}
              {kodeRekDisplay}
            </td>
          </tr>
        </tbody>
      </table>

      {/* === TITLE (centered, bold, underlined) === */}
      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "16pt",
          textDecoration: "underline",
          margin: "16px 0 12px 0",
        }}
      >
        TANDA PEMBAYARAN
      </div>

      {/* === BODY BLOCK - label rata kiri width sama, ':' sejajar === */}
      {/* Per PDF: each label is left-aligned with a fixed width so the
          trailing ':' lines up. The 'Nomor Surat persetujuan penyediaan
          barang' line has no colon (it's the start of a 2-line label);
          the next line 'dan jasa' has the colon and the value. */}
      <div style={{ fontSize: "10pt", lineHeight: 1.8, marginBottom: "16px" }}>
        <div>
          <span style={bodyLabelStyle}>Sudah terima dari</span>
          {" : "}Bendahara SMA Negeri 1 Telukdalam
        </div>
        <div>
          <span style={bodyLabelStyle}>Uang sebesar</span>
          {" : "}
          <span style={{ fontWeight: 700 }}>Rp {formatNumber(total)}</span>
        </div>
        <div>
          <span style={bodyLabelStyle}>Terbilang</span>
          {" : "}
          <span style={{ fontStyle: "italic", fontWeight: 700 }}>
            {terbilangText}
          </span>
        </div>
        <div>Nomor Surat persetujuan penyediaan barang</div>
        <div>
          <span style={bodyLabelStyle}>dan jasa</span>
          {" : "}
          {nomorSurat}
        </div>
        <div>
          <span style={bodyLabelStyle}>Untuk pembayaran</span>
          {" : "}
          {firstUraian}
        </div>
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
                fontSize: "10pt",
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
                fontSize: "10pt",
              }}
            >
              <div>Lunas Bayar Oleh :</div>
              <div>Bendahara SMA Negeri 1 Telukdalam</div>
              <div style={{ height: "56px" }} />
              <div style={nameStyle}>{treasurerName}</div>
              <div>{treasurerRank}</div>
              <div>NIP. {treasurerNip}</div>
            </td>
            {/* Kolom 3: Diterima oleh / Vendor — shifted right with extra
                left padding so the Kepala Sekolah block below (centered
                on the page) visually sits in the middle of the available
                space between the Lunas Bayar column and this column. */}
            <td
              style={{
                width: "33%",
                textAlign: "left",
                verticalAlign: "top",
                padding: "8px 0 0 50px",
                fontSize: "10pt",
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
          fontSize: "10pt",
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
