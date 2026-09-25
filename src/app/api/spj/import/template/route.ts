import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

// GET /api/spj/import/template
// Generates and returns a clean .xlsx template for importing data belanja.
// The template has:
//   - Title row (row 1, merged A1:AH1)
//   - Header row (row 2) with all 34 column names
//   - Number row (row 3) with sequential 1..34
//   - Sample data row (row 4) showing example format (user can delete)
//   - Empty rows 5-100 ready for user input
//   - No external formulas (all manual input)

// All 34 columns in canonical order — matches the user's original template
const COLUMNS: { name: string; sample: string | number; width: number }[] = [
  { name: "No. Surat Pesan", sample: "01", width: 14 },
  { name: "No BKU", sample: "BPU01", width: 12 },
  { name: "Kode Program", sample: "05.05.02.", width: 14 },
  { name: "Kode Rekening", sample: "5.1.02.01.01.0052", width: 22 },
  { name: "Tanggal Perencanaan", sample: "01/01/2025", width: 18 },
  { name: "Tanggal Pesanan", sample: "06/01/2025", width: 16 },
  { name: "Tanggal BAST", sample: "06/01/2025", width: 16 },
  { name: "Tanggal Pemeriksaan", sample: "06/01/2025", width: 18 },
  { name: "Tanggal Bayar", sample: "23/01/2025", width: 16 },
  { name: "Uraian Kegiatan", sample: "Pembelian Air Mineral untuk kegiatan bulanan", width: 40 },
  { name: "Nama Barang", sample: "Aqua Cup 250ml", width: 30 },
  { name: "Volume", sample: 25, width: 8 },
  { name: "Satuan", sample: "dus", width: 10 },
  { name: "Harga Satuan", sample: 50000, width: 14 },
  { name: "Jumlah", sample: 1250000, width: 16 },
  { name: "Kategori Belanja", sample: "Air Mineral", width: 22 },
  { name: "Spesifikasi Barang", sample: "Aqua Cup (Diameter 6.3cm, Tinggi 9.5cm)", width: 40 },
  { name: "Harga Toko 1", sample: 55000, width: 14 },
  { name: "Harga Toko 2", sample: 65000, width: 14 },
  { name: "Nama Toko 1", sample: "Toko Sumber Rejeki", width: 28 },
  { name: "Nama Toko 2", sample: "UD. JESSLYN", width: 28 },
  { name: "Direktur Toko 1", sample: "Budi Santoso", width: 24 },
  { name: "Alamat Toko 1", sample: "Jl. Ahmad Yani No.89, Pasar Telukdalam, Nias Selatan", width: 50 },
  { name: "Alamat Toko 2", sample: "Jl. Pasir Putih Pasar Telukdalam, Nias Selatan", width: 50 },
  { name: "Uraian Kwitansi", sample: "Air Mineral", width: 22 },
  { name: "Nama Pekerjaan / Kategori", sample: "Air Mineral", width: 26 },
  { name: "Satuan", sample: "kotak", width: 10 },
  { name: "Harga Satuan sebelum pajak", sample: 11000, width: 22 },
  { name: "Jumlah Harga Sebelum Pajak", sample: 55000, width: 24 },
  { name: "Harga Total Asli", sample: 55000, width: 16 },
  { name: "Total Harga Sebelum DPP", sample: 49549.55, width: 24 },
  { name: "Total Harga Asli", sample: 55000, width: 16 },
  { name: "Alamat Surat Balasan Toko", sample: "Telukdalam", width: 24 },
  { name: "NO HP", sample: "081234567890", width: 16 },
];

const KATEGORI_LIST = [
  "Air Mineral",
  "Alat Kebersihan",
  "Alat Tulis Kantor (ATK)",
  "Bahan /Alat Pemeliharaan",
  "Buku Paket Siswa dan Guru",
  "Honorarium",
  "Jasa Angkutan",
  "Jasa Internet",
  "Jasa PLN",
  "Konsumsi",
  "Kudapan",
  "Pemeliharaan",
  "Penggandaan",
  "Peralatan Listrik",
  "Peralatan Sekolah",
  "Spanduk",
];

const SATUAN_LIST = [
  "botol",
  "buah",
  "bulan",
  "bungkus",
  "dus",
  "eksemplar",
  "jpl",
  "kegiatan",
  "kotak",
  "lembar",
  "lusin",
  "orang / hari",
  "orang / jam pelajaran",
  "orang / kali",
  "pak",
  "paket",
  "pasang",
  "rim",
  "unit",
];

export async function GET() {
  try {
    // Build worksheet data (array of arrays)
    const data: (string | number)[][] = [];

    // Row 1: Title
    const titleRow: string[] = Array(COLUMNS.length).fill("");
    titleRow[0] =
      "B E L A N J A   S E T A H U N   S M A   N E G E R I   1   T E L U K D A L A M";
    data.push(titleRow);

    // Row 2: Headers
    data.push(COLUMNS.map((c) => c.name));

    // Row 3: Sequential numbers 1..34
    data.push(COLUMNS.map((_, i) => i + 1));

    // Row 4: Sample row (user can delete or keep as reference)
    data.push(COLUMNS.map((c) => c.sample));

    // Rows 5-100: Empty rows ready for input (96 rows)
    for (let i = 0; i < 96; i++) {
      data.push(Array(COLUMNS.length).fill(""));
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));

    // Merge title row A1:AH1
    ws["!merges"] = [
      {
        s: { r: 0, c: 0 },
        e: { r: 0, c: COLUMNS.length - 1 },
      },
    ];

    // Style: title cell (bold, larger)
    const titleCell = ws["A1"];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Style: header row (bold, fill color, border)
    for (let i = 0; i < COLUMNS.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 1, c: i });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1F4E79" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    // Style: number row (light grey background)
    for (let i = 0; i < COLUMNS.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 2, c: i });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 10, color: { rgb: "808080" } },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: "F2F2F2" } },
        };
      }
    }

    // Style: sample row (light yellow background to indicate "example")
    for (let i = 0; i < COLUMNS.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: i });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          font: { italic: true, sz: 10, color: { rgb: "606060" } },
          fill: { fgColor: { rgb: "FFFDE7" } },
        };
      }
    }

    // Add data validation (dropdowns) for Kategori Belanja (column P, index 15)
    // and Satuan columns (M index 12, AA index 26)
    // Note: xlsx community edition doesn't write data validations directly,
    // but we can write the !dataValidation property if supported.
    // For broader compatibility, we'll skip DV in favor of having the sample row as guidance.

    // Create workbook
    const wb = XLSX.utils.book_new();
    wb.SheetNames = ["Master"];
    wb.Sheets = { Master: ws };

    // Generate buffer (xlsx format)
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer;

    const filename =
      "template_import_SPJ_" +
      new Date().toISOString().split("T")[0] +
      ".xlsx";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (e) {
    console.error("Template generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate template: " + (e as Error).message },
      { status: 500 }
    );
  }
}

// Export the column list and category list for documentation purposes
export const IMPORT_COLUMNS = COLUMNS;
export const KATEGORI_BELANJA = KATEGORI_LIST;
export const SATUAN_LIST_EXPORT = SATUAN_LIST;
