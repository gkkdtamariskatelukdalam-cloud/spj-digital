"use client";

import type { CSSProperties } from "react";
import type { DocumentGroup, School } from "@/lib/types/spj";
import { formatDate } from "@/lib/format";
import { orDash, schoolName } from "./_helpers";
import { RupiahCell } from "./_rupiah";
// Per-document page setup — Excel 02BANDING sheet margins (cm):
//   L=0.80 R=0.80 T=1.50 B=0.80  scale=90%  landscape
import { PAGE_SETUP_02BANDING as PAGE_SETUP } from "./_page-setup";
export { PAGE_SETUP };

// ============================================================
// 02BANDING — Dokumen Hasil Pembanding
// ============================================================
// Reference: User-provided PDF + Excel from Google Drive
//   - PDF: https://drive.google.com/file/d/1RCHZELnrHaqjEijN-v9gBnPX0aMhhBcS
//   - Excel: https://docs.google.com/spreadsheets/d/1zb7oLx3CE28O-z_A0gYsiuaqhoV8xZPr
//
// Layout match reference:
//   1. Title: "DOKUMEN HASIL PEMBANDING" (19pt bold, centered)
//   2. Info block (borderless): Satuan Pendidikan + Hasil pembanding
//   3. Comparison table with 5 visual columns:
//        Col 1: No (rowSpan 4 per item — item number)
//        Col 2: Label (Nama Produk, Harga satuan, Spesifikasi, Estimasi harga)
//        Col 3: Toko 1 data (per-item)
//        Col 4: Toko 2 data (per-item)
//        Col 5: dst (empty — for additional vendors in future)
//   4. Header rows (2 rows):
//        Row 1: No (rowSpan 2) | empty | "Produk I" | "Produk II" | "dst"
//        Row 2: (covered) | "Nama Calon penyedia" | toko1Name | toko2Name | empty
//   5. Per item (4 rows):
//        Row 1: noNumber (rowSpan 4) | "Nama Produk" | namaBarang | namaBarang | empty
//        Row 2: (covered)   | "Harga satuan" | RupiahCell(hargaToko1) | RupiahCell(hargaToko2) | empty
//        Row 3: (covered)   | "Spesifikasi"  | spesifikasiBarang     | spesifikasiBarang     | empty
//        Row 4: (covered)   | "Estimasi harga" | RupiahCell(hargaToko1) | RupiahCell(hargaToko2) | empty
//   6. Footer row: (empty) | "Alamat calon penyedia" | alamatToko1 | alamatToko2 | empty
//   7. Signature block (right-aligned):
//        "Telukdalam, {date}"
//        "Pelaksana"
//        (50px space for wet-ink signature)
//        principalName (underlined)
//        "NIP. {principalNip}"
// ============================================================

interface DokumenPembandingProps {
  group: DocumentGroup;
  school: School | null;
}

const cellStyle: CSSProperties = {
  border: "1px solid #000",
  padding: "2px 5px",
  verticalAlign: "top",
  fontSize: "11pt",
  lineHeight: 1.2,
};
const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  border: "2px solid #000", // outer border 2px (per Excel)
};
const headerCellStyle: CSSProperties = {
  ...cellStyle,
  background: "#e2e8f0",
  fontWeight: 700,
  textAlign: "center",
};
const borderlessTableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};
const labelCellNoBorder: CSSProperties = {
  padding: "1px 6px",
  verticalAlign: "top",
  whiteSpace: "nowrap",
  fontSize: "12pt",
};
const nameStyle: CSSProperties = {
  fontWeight: 700,
  textDecoration: "underline",
};

export function DokumenPembanding({ group, school }: DokumenPembandingProps) {
  const vendorName = orDash(group.vendorName);
  const tglPesan = group.tglPesan;
  const formattedDate = formatDate(tglPesan);

  // Toko info — typically same for all items in a group; use first item's data
  const firstItem = group.items[0];
  const toko1Name = firstItem?.namaToko1 || "—";
  const toko2Name = firstItem?.namaToko2 || "—";
  const toko1Address = firstItem?.alamatToko1 || "—";
  const toko2Address = firstItem?.alamatToko2 || "—";

  // Filter items with namaBarang or uraian (skip empty rows)
  const items = group.items.filter(
    (it) =>
      (it.namaBarang && it.namaBarang.trim()) ||
      (it.uraian && it.uraian.trim()),
  );

  // Label rows per item (4 sub-rows: Nama Produk, Harga satuan, Spesifikasi, Estimasi harga)
  // Reference PDF shows exactly these 4 rows per item.
  const itemSubRows = [
    { label: "Nama Produk", field: "nama" },
    { label: "Harga satuan", field: "harga" },
    { label: "Spesifikasi", field: "spec" },
    { label: "Estimasi harga", field: "estimasi" },
  ] as const;

  // Helper to render cell value per field
  const renderCellValue = (
    item: (typeof items)[number] | undefined,
    field: string,
    isRupiah: boolean,
  ) => {
    if (!item) return <span>—</span>;
    if (field === "nama") {
      return <span>{item.namaBarang || item.uraian || "—"}</span>;
    }
    if (field === "spec") {
      return <span>{item.spesifikasiBarang || "—"}</span>;
    }
    if (field === "harga" || field === "estimasi") {
      // Harga satuan and Estimasi harga both show hargaToko1 / hargaToko2
      // (Estimasi harga = harga satuan × 1 unit, same value for single-unit items)
      return <RupiahCell amount={field === "harga" ? item.hargaToko1 : item.hargaToko1} dashOnEmpty />;
    }
    return <span>—</span>;
  };

  return (
    <div className="spj-doc text-[11pt] leading-relaxed text-slate-900">
      {/* === Title (19pt bold centered, per Excel A1) === */}
      <div className="text-center mb-3">
        <h1 className="font-bold" style={{ fontSize: "19pt" }}>
          DOKUMEN HASIL PEMBANDING
        </h1>
      </div>

      {/* === Info block (borderless 2-col, per Excel B2-D3) === */}
      <div className="mb-3">
        <table style={borderlessTableStyle}>
          <tbody>
            <tr>
              <td style={{ ...labelCellNoBorder, width: "200px" }}>
                Satuan Pendidikan
              </td>
              <td style={labelCellNoBorder}>: {schoolName(school)}</td>
            </tr>
            <tr>
              <td style={labelCellNoBorder}>Hasil pembanding</td>
              <td style={labelCellNoBorder}>
                : Tercapai kesepakatan pembelian dengan {vendorName}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === Comparison table (5 visual cols) === */}
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "40px" }} />   {/* Col 1: No */}
          <col style={{ width: "180px" }} /> {/* Col 2: Label */}
          <col />                             {/* Col 3: Toko 1 */}
          <col />                             {/* Col 4: Toko 2 */}
          <col style={{ width: "60px" }} />  {/* Col 5: dst */}
        </colgroup>
        <tbody>
          {/* === Header row 1: No (rowSpan 2) | empty | Produk I | Produk II | dst === */}
          <tr>
            <td style={{ ...headerCellStyle, rowSpan: 2 }} rowSpan={2}>
              No
            </td>
            <td style={headerCellStyle} rowSpan={2}>Nama Calon penyedia</td>
            <td style={headerCellStyle}>Produk I</td>
            <td style={headerCellStyle}>Produk II</td>
            <td style={headerCellStyle}>dst</td>
          </tr>
          {/* === Header row 2: toko1Name | toko2Name | empty === */}
          <tr>
            <td style={{ ...cellStyle, fontWeight: 700, textAlign: "left" }}>
              {toko1Name}
            </td>
            <td style={{ ...cellStyle, fontWeight: 700, textAlign: "left" }}>
              {toko2Name}
            </td>
            <td style={cellStyle}>&nbsp;</td>
          </tr>

          {/* === Items (4 sub-rows per item) === */}
          {items.length === 0 ? (
            <tr>
              <td style={cellStyle} colSpan={5} className="text-center text-muted-foreground">
                Tidak ada item.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <ItemRows
                key={item.id}
                itemNumber={idx + 1}
                item={item}
                subRows={itemSubRows}
                renderCellValue={renderCellValue}
              />
            ))
          )}

          {/* === Footer row: Alamat calon penyedia === */}
          <tr>
            <td style={cellStyle}>&nbsp;</td>
            <td style={{ ...cellStyle, fontWeight: 700 }}>Alamat calon penyedia</td>
            <td style={cellStyle}>{toko1Address}</td>
            <td style={cellStyle}>{toko2Address}</td>
            <td style={cellStyle}>&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {/* === Signature block (right-aligned, same style as Dokumen Rencana) === */}
      <div
        style={{
          marginTop: "20px",
          fontSize: "11pt",
          display: "flex",
          justifyContent: "flex-end",
          marginRight: "40px",
        }}
      >
        <div style={{ textAlign: "left", width: "320px" }}>
          <div style={{ whiteSpace: "nowrap" }}>Telukdalam, {formattedDate}</div>
          <div style={{ whiteSpace: "nowrap" }}>Pelaksana</div>
          <div style={{ height: "50px" }} />
          <div style={{ ...nameStyle, whiteSpace: "nowrap" }}>
            {orDash(school?.principalName)}
          </div>
          <div style={{ whiteSpace: "nowrap" }}>
            NIP. {orDash(school?.principalNip)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ItemRows — renders 4 sub-rows for one item:
//   Row 1: itemNumber (rowSpan 4) | Nama Produk | namaBarang | namaBarang | empty
//   Row 2: (covered)              | Harga satuan | RupiahCell(hargaToko1) | RupiahCell(hargaToko2) | empty
//   Row 3: (covered)              | Spesifikasi  | spesifikasiBarang     | spesifikasiBarang     | empty
//   Row 4: (covered)              | Estimasi harga | RupiahCell(hargaToko1) | RupiahCell(hargaToko2) | empty
// ============================================================

interface ItemRowsProps {
  itemNumber: number;
  item: DocumentGroup["items"][number];
  subRows: ReadonlyArray<{ label: string; field: string }>;
  renderCellValue: (
    item: DocumentGroup["items"][number] | undefined,
    field: string,
    isRupiah: boolean,
  ) => React.ReactNode;
}

function ItemRows({ itemNumber, item, subRows, renderCellValue }: ItemRowsProps) {
  return (
    <>
      {subRows.map((sub, subIdx) => {
        const isFirstSub = subIdx === 0;
        const isRupiahField = sub.field === "harga" || sub.field === "estimasi";
        // For Harga satuan and Estimasi harga, show hargaToko1 / hargaToko2
        const toko1Value =
          sub.field === "harga" || sub.field === "estimasi"
            ? <RupiahCell amount={item.hargaToko1} dashOnEmpty />
            : sub.field === "nama"
              ? <span>{item.namaBarang || item.uraian || "—"}</span>
              : sub.field === "spec"
                ? <span>{item.spesifikasiBarang || "—"}</span>
                : <span>—</span>;
        const toko2Value =
          sub.field === "harga" || sub.field === "estimasi"
            ? <RupiahCell amount={item.hargaToko2} dashOnEmpty />
            : sub.field === "nama"
              ? <span>{item.namaBarang || item.uraian || "—"}</span>
              : sub.field === "spec"
                ? <span>{item.spesifikasiBarang || "—"}</span>
                : <span>—</span>;

        return (
          <tr key={subIdx}>
            {/* Col 1: item number (rowSpan 4, only on first sub-row) */}
            {isFirstSub && (
              <td
                style={{ ...cellStyle, textAlign: "center", verticalAlign: "middle" }}
                rowSpan={4}
              >
                {itemNumber}
              </td>
            )}
            {/* Col 2: Label */}
            <td style={cellStyle}>{sub.label}</td>
            {/* Col 3: Toko 1 value */}
            <td style={{ ...cellStyle, textAlign: isRupiahField ? "right" : "left" }}>
              {toko1Value}
            </td>
            {/* Col 4: Toko 2 value */}
            <td style={{ ...cellStyle, textAlign: isRupiahField ? "right" : "left" }}>
              {toko2Value}
            </td>
            {/* Col 5: dst (empty) */}
            <td style={cellStyle}>&nbsp;</td>
          </tr>
        );
      })}
    </>
  );
}
