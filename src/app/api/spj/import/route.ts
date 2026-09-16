import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

// POST /api/spj/import
// Accepts multipart form data with file field "file" (Excel .xlsx)
// Parses the Excel and imports transactions, vendors, and BPU codes
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .xlsx or .xls files are allowed" },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    // Find the first sheet (or sheet named "Master")
    let sheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      if (name.toLowerCase().includes("master")) {
        sheetName = name;
        break;
      }
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      return NextResponse.json(
        { error: `Sheet "${sheetName}" not found` },
        { status: 400 }
      );
    }

    // Convert sheet to JSON array (header: 1 means array of arrays)
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      defval: null,
    }) as unknown[][];

    if (rows.length < 4) {
      return NextResponse.json(
        { error: "Excel file has insufficient rows (need at least 4 rows: title, header, numbers, data)" },
        { status: 400 }
      );
    }

    // Row 1 (index 0): Title (skip)
    // Row 2 (index 1): Headers
    // Row 3 (index 2): Column numbers (1, 2, 3...) - skip
    // Row 4+ (index 3+): Data
    const headers = (rows[1] as unknown[]).map((h) =>
      h ? String(h).trim() : ""
    );

    // Map column indices based on headers
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes("no. surat pesan") || lower === "no. surat pesan")
        colMap.noPesan = i;
      else if (lower.includes("no bku")) colMap.noBku = i;
      else if (lower.includes("tanggal perencanaan")) colMap.tglPerencanaan = i;
      else if (lower.includes("tanggal pesanan")) colMap.tglPesan = i;
      else if (lower.includes("tanggal bast")) colMap.tglBast = i;
      else if (lower.includes("tanggal pemeriksaan")) colMap.tglPeriksa = i;
      else if (lower.includes("tanggal bayar")) colMap.tglBayar = i;
      else if (lower.includes("uraian kegiatan")) colMap.uraian = i;
      else if (lower.includes("nama barang")) colMap.namaBarang = i;
      else if (lower === "volume") colMap.volume = i;
      else if (lower === "satuan") colMap.satuan = i;
      else if (lower.includes("harga satuan")) colMap.hargaSatuan = i;
      else if (lower === "jumlah") colMap.jumlah = i;
      else if (lower.includes("kategori belanja")) colMap.kategori = i;
      else if (lower.includes("spesifikasi")) colMap.spesifikasi = i;
      else if (lower.includes("harga toko 1")) colMap.hargaToko1 = i;
      else if (lower.includes("nama toko 1") || lower === "nama toko 1")
        colMap.namaToko1 = i;
      else if (lower.includes("direktur toko 1")) colMap.direkturToko1 = i;
      else if (lower.includes("alamat toko 1")) colMap.alamatToko1 = i;
      else if (lower.includes("no hp") || lower.includes("no. hp"))
        colMap.noHp = i;
    });

    // Parse data rows (starting from row 4, index 3)
    const dataRows = rows.slice(3).filter((row) => {
      // Skip empty rows
      const hasData = (row as unknown[]).some(
        (cell) => cell !== null && cell !== undefined && cell !== ""
      );
      return hasData;
    });

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in Excel file" },
        { status: 400 }
      );
    }

    // Helper: parse date from various formats
    function parseDate(val: unknown): string | null {
      if (val === null || val === undefined || val === "") return null;
      if (val instanceof Date) return val.toISOString().split("T")[0];
      if (typeof val === "number") {
        // Excel serial date
        const date = XLSX.SSF.parse_date_code(val);
        if (date && date.y) {
          return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
        }
      }
      const str = String(val).trim();
      // Try dd/mm/yyyy
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }
      // Try ISO
      if (str.includes("-") && str.length >= 10) {
        return str.substring(0, 10);
      }
      return str;
    }

    // Helper: parse number
    function parseNum(val: unknown): number {
      if (val === null || val === undefined || val === "") return 0;
      if (typeof val === "number") return val;
      const cleaned = String(val).replace(/[^\d.-]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }

    // Helper: parse string
    function parseStr(val: unknown): string {
      if (val === null || val === undefined) return "";
      const str = String(val).trim();
      if (str === "#N/A" || str === "#N/a" || str === "#n/a") return "";
      return str;
    }

    // Collect vendors (unique by name)
    const vendorMap = new Map<
      string,
      { name: string; owner: string | null; phone: string | null; address: string | null }
    >();

    // Collect BPU codes
    const bpuSet = new Set<string>();

    // Collect transactions
    const transactions: Array<{
      noUrut: number | null;
      noPesan: string;
      noBku: string;
      bpuCode: string;
      tglPerencanaan: string | null;
      tglPesan: string | null;
      tglBast: string | null;
      tglBayar: string | null;
      uraian: string;
      namaBarang: string;
      volume: number;
      satuan: string;
      tarifHarga: number;
      jumlah: number;
      kategori: string;
      vendorName: string;
    }> = [];

    for (const row of dataRows) {
      const cells = row as unknown[];

      const noPesan = parseStr(cells[colMap.noPesan]);
      const noBku = parseStr(cells[colMap.noBku]);
      const uraian = parseStr(cells[colMap.uraian]);
      const namaBarang = parseStr(cells[colMap.namaBarang]);

      // Skip rows without essential data
      if (!uraian && !namaBarang && !noPesan) continue;

      const vendorName = parseStr(cells[colMap.namaToko1]);
      const vendorOwner = parseStr(cells[colMap.direkturToko1]);
      const vendorPhone = parseStr(cells[colMap.noHp]);
      const vendorAddress = parseStr(cells[colMap.alamatToko1]);

      // Collect vendor
      if (vendorName) {
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, {
            name: vendorName,
            owner: vendorOwner || null,
            phone: vendorPhone || null,
            address: vendorAddress || null,
          });
        }
      }

      // Collect BPU
      if (noBku) bpuSet.add(noBku);

      const tglPesan = parseDate(cells[colMap.tglPesan]);
      const tglBast = parseDate(cells[colMap.tglBast]);
      const tglBayar = parseDate(cells[colMap.tglBayar]);

      // Determine bulan from tglPesan
      let bulan: number | null = null;
      if (tglPesan) {
        const month = parseInt(tglPesan.split("-")[1]);
        if (month >= 1 && month <= 12) bulan = month;
      }

      transactions.push({
        noUrut: parseNum(cells[colMap.noPesan]) || null,
        noPesan: noPesan,
        noBku: noBku,
        bpuCode: noBku,
        tglPerencanaan: parseDate(cells[colMap.tglPerencanaan]),
        tglPesan: tglPesan,
        tglBast: tglBast,
        tglBayar: tglBayar,
        uraian: uraian,
        namaBarang: namaBarang,
        volume: parseNum(cells[colMap.volume]),
        satuan: parseStr(cells[colMap.satuan]),
        tarifHarga: parseNum(cells[colMap.hargaSatuan]),
        jumlah: parseNum(cells[colMap.jumlah]),
        kategori: parseStr(cells[colMap.kategori]),
        vendorName: vendorName,
      });
    }

    // Now import into database
    // 1. Create vendors
    const vendorIdMap = new Map<string, string>();
    for (const [name, vdata] of vendorMap) {
      const existing = await db.vendor.findFirst({ where: { name } });
      if (existing) {
        vendorIdMap.set(name, existing.id);
      } else {
        const created = await db.vendor.create({
          data: {
            name: vdata.name,
            owner: vdata.owner,
            phone: vdata.phone,
            address: vdata.address,
          },
        });
        vendorIdMap.set(name, created.id);
      }
    }

    // 2. Create BPU codes
    let bpuCreated = 0;
    for (const code of bpuSet) {
      const existing = await db.bpu.findFirst({ where: { code } });
      if (!existing) {
        await db.bpu.create({ data: { code } });
        bpuCreated++;
      }
    }

    // 3. Create transactions
    let txCreated = 0;
    let txSkipped = 0;
    for (const tx of transactions) {
      // Skip if essential fields missing
      if (!tx.uraian && !tx.namaBarang) {
        txSkipped++;
        continue;
      }

      const vendorId = tx.vendorName
        ? vendorIdMap.get(tx.vendorName) || null
        : null;

      await db.transaction.create({
        data: {
          noUrut: tx.noUrut,
          tglPesan: tx.tglPesan,
          noPesan: tx.noPesan || null,
          tglBast: tx.tglBast,
          noBast: null,
          tglBayar: tx.tglBayar,
          noBku: tx.noBku || null,
          bpuCode: tx.bpuCode || null,
          uraian: tx.uraian || tx.namaBarang || "",
          namaBarang: tx.namaBarang || null,
          volume: tx.volume,
          satuan: tx.satuan || null,
          tarifHarga: tx.tarifHarga,
          jumlah: tx.jumlah,
          realisasi: tx.jumlah,
          bulan: tx.bulan,
          tahun: 2025,
          masukBku: tx.tglBayar ? "MASUK BKU" : null,
          status: tx.tglBayar ? "lunas" : "pending",
          vendorId: vendorId,
        },
      });
      txCreated++;
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: dataRows.length,
        transactionsImported: txCreated,
        transactionsSkipped: txSkipped,
        vendorsImported: vendorMap.size,
        bpuImported: bpuCreated,
        sheetName: sheetName,
      },
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json(
      { error: "Failed to import: " + (e as Error).message },
      { status: 500 }
    );
  }
}
