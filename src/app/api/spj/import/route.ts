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

    // Map column indices based on headers - ALL 38 Excel columns
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      const lower = h.toLowerCase();
      if (lower.includes("no. surat pesan")) colMap.noPesan = i;
      else if (lower.includes("no bku")) colMap.noBku = i;
      else if (lower.includes("kode program")) colMap.kodeProgram = i;
      else if (lower.includes("kode rekening")) colMap.kodeRekening = i;
      else if (lower.includes("tanggal perencanaan")) colMap.tglPerencanaan = i;
      else if (lower.includes("tanggal pesanan")) colMap.tglPesan = i;
      else if (lower.includes("tanggal bast")) colMap.tglBast = i;
      else if (lower.includes("tanggal pemeriksaan")) colMap.tglPeriksa = i;
      else if (lower.includes("tanggal bayar")) colMap.tglBayar = i;
      else if (lower.includes("uraian kegiatan")) colMap.uraian = i;
      else if (lower.includes("nama barang")) colMap.namaBarang = i;
      else if (lower === "volume") colMap.volume = i;
      else if (lower === "satuan" && colMap.satuan === undefined) colMap.satuan = i;
      else if (lower === "satuan") colMap.satuan2 = i;
      else if (lower.includes("harga satuan sebelum")) colMap.hargaSatuanSebelumPajak = i;
      else if (lower.includes("harga satuan")) colMap.hargaSatuan = i;
      else if (lower === "jumlah" && colMap.jumlah === undefined) colMap.jumlah = i;
      else if (lower.includes("jumlah harga sebelum")) colMap.jumlahHargaSebelumPajak = i;
      else if (lower.includes("kategori belanja")) colMap.kategoriBelanja = i;
      else if (lower.includes("spesifikasi")) colMap.spesifikasiBarang = i;
      else if (lower.includes("harga toko 1")) colMap.hargaToko1 = i;
      else if (lower.includes("harga toko 2")) colMap.hargaToko2 = i;
      else if (lower.includes("harga total asli")) colMap.hargaTotalAsli = i;
      else if (lower.includes("total harga sebelum dpp")) colMap.totalHargaSebelumDPP = i;
      else if (lower.includes("total harga asli")) colMap.totalHargaAsli = i;
      else if (lower.includes("nama toko 1")) colMap.namaToko1 = i;
      else if (lower.includes("nama toko 2")) colMap.namaToko2 = i;
      else if (lower.includes("direktur toko 1")) colMap.direkturToko1 = i;
      else if (lower.includes("alamat toko 1")) colMap.alamatToko1 = i;
      else if (lower.includes("alamat toko 2")) colMap.alamatToko2 = i;
      else if (lower.includes("uraian kwitansi")) colMap.uraianKwitansi = i;
      else if (lower.includes("nama pekerjaan")) colMap.namaPekerjaanKategori = i;
      else if (lower.includes("alamat surat balasan")) colMap.alamatSuratBalasan = i;
      else if (lower.includes("no hp") || lower.includes("no. hp")) colMap.noHp = i;
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
      if (val instanceof Date) {
        // Excel empty date serial 0 = 1899-12-30, treat as null
        if (val.getFullYear() <= 1900) return null;
        return val.toISOString().split("T")[0];
      }
      if (typeof val === "number") {
        // Excel serial date - 0 or very small = empty
        if (val <= 60) return null;
        const date = XLSX.SSF.parse_date_code(val);
        if (date && date.y && date.y > 1900) {
          return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
        }
        return null;
      }
      const str = String(val).trim();
      if (str === "" || str === "0") return null;
      // Try dd/mm/yyyy
      if (str.includes("/")) {
        const parts = str.split("/");
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const year = parseInt(y);
          if (year < 2000) return null; // invalid year
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }
      // Try ISO
      if (str.includes("-") && str.length >= 10) {
        const year = parseInt(str.substring(0, 4));
        if (year < 2000) return null; // invalid year (e.g. 1899)
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

    // Helper: parse string - treat "0", "#N/A", "#REF!" as empty (data belum diisi)
    // In the Excel, "0" in text columns means the cell hasn't been filled yet
    function parseStr(val: unknown): string {
      if (val === null || val === undefined) return "";
      const str = String(val).trim();
      if (str === "" || str === "0" || str === "#N/A" || str === "#N/a" || str === "#n/a" || str === "#REF!") return "";
      return str;
    }

    // Collect vendors (unique by name)
    const vendorMap = new Map<
      string,
      { name: string; owner: string | null; phone: string | null; address: string | null }
    >();

    // Collect BPU codes
    const bpuSet = new Set<string>();

    // Collect transactions - ALL Excel columns
    const transactions: Array<{
      noUrut: number | null;
      noPesan: string;
      noBku: string;
      bpuCode: string;
      kodeProgram: string;
      kodeRekening: string;
      tglPerencanaan: string | null;
      tglPesan: string | null;
      tglBast: string | null;
      tglPeriksa: string | null;
      tglBayar: string | null;
      uraian: string;
      namaBarang: string;
      volume: number;
      satuan: string;
      tarifHarga: number;
      jumlah: number;
      kategoriBelanja: string;
      spesifikasiBarang: string;
      hargaToko1: number | null;
      hargaToko2: number | null;
      namaToko1: string;
      namaToko2: string;
      direkturToko1: string;
      alamatToko1: string;
      alamatToko2: string;
      uraianKwitansi: string;
      namaPekerjaanKategori: string;
      satuan2: string;
      hargaSatuanSebelumPajak: number | null;
      jumlahHargaSebelumPajak: number | null;
      hargaTotalAsli: number | null;
      totalHargaSebelumDPP: number | null;
      totalHargaAsli: number | null;
      alamatSuratBalasan: string;
      noHp: string;
      bulan: number | null;
      vendorName: string;
      excelRowNum: number;
    }> = [];

    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
      const row = dataRows[rowIdx];
      const excelRowNum = rowIdx + 4; // Excel data starts at row 4
      const cells = row as unknown[];

      const noPesan = parseStr(cells[colMap.noPesan]);
      const noBku = parseStr(cells[colMap.noBku]);
      const uraian = parseStr(cells[colMap.uraian]);
      const namaBarang = parseStr(cells[colMap.namaBarang]);
      const volume = parseNum(cells[colMap.volume]);
      const tarifHarga = parseNum(cells[colMap.hargaSatuan]);
      const jumlah = parseNum(cells[colMap.jumlah]);

      // Skip ONLY rows that have NO meaningful data at all
      // Rows with partial data (e.g. has vendor but no uraian) are kept as "draft"
      // Meaningful data = any text field that's not null/empty/"0"/"#N/A"
      const hasAnyTextData = cells.some((c) => {
        if (c === null || c === undefined || c === "" || c === "0" || c === 0) return false;
        if (typeof c === "string") {
          const s = c.trim();
          return s !== "" && s !== "0" && s !== "#N/A" && s !== "#N/a" && s !== "#n/a" && s !== "#REF!";
        }
        return true; // numbers, dates
      });
      if (!hasAnyTextData) continue;

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
        kodeProgram: parseStr(cells[colMap.kodeProgram]),
        kodeRekening: parseStr(cells[colMap.kodeRekening]),
        tglPerencanaan: parseDate(cells[colMap.tglPerencanaan]),
        tglPesan: tglPesan,
        tglBast: tglBast,
        tglPeriksa: parseDate(cells[colMap.tglPeriksa]),
        tglBayar: tglBayar,
        uraian: uraian,
        namaBarang: namaBarang,
        volume: volume,
        satuan: parseStr(cells[colMap.satuan]),
        tarifHarga: tarifHarga,
        jumlah: jumlah,
        kategoriBelanja: parseStr(cells[colMap.kategoriBelanja]),
        spesifikasiBarang: parseStr(cells[colMap.spesifikasiBarang]),
        hargaToko1: colMap.hargaToko1 !== undefined ? parseNum(cells[colMap.hargaToko1]) || null : null,
        hargaToko2: colMap.hargaToko2 !== undefined ? parseNum(cells[colMap.hargaToko2]) || null : null,
        namaToko1: vendorName,
        namaToko2: parseStr(cells[colMap.namaToko2]),
        direkturToko1: vendorOwner,
        alamatToko1: vendorAddress,
        alamatToko2: parseStr(cells[colMap.alamatToko2]),
        uraianKwitansi: parseStr(cells[colMap.uraianKwitansi]),
        namaPekerjaanKategori: parseStr(cells[colMap.namaPekerjaanKategori]),
        satuan2: parseStr(cells[colMap.satuan2]),
        hargaSatuanSebelumPajak: colMap.hargaSatuanSebelumPajak !== undefined ? parseNum(cells[colMap.hargaSatuanSebelumPajak]) || null : null,
        jumlahHargaSebelumPajak: colMap.jumlahHargaSebelumPajak !== undefined ? parseNum(cells[colMap.jumlahHargaSebelumPajak]) || null : null,
        hargaTotalAsli: colMap.hargaTotalAsli !== undefined ? parseNum(cells[colMap.hargaTotalAsli]) || null : null,
        totalHargaSebelumDPP: colMap.totalHargaSebelumDPP !== undefined ? parseNum(cells[colMap.totalHargaSebelumDPP]) || null : null,
        totalHargaAsli: colMap.totalHargaAsli !== undefined ? parseNum(cells[colMap.totalHargaAsli]) || null : null,
        alamatSuratBalasan: parseStr(cells[colMap.alamatSuratBalasan]),
        noHp: vendorPhone,
        bulan: bulan,
        vendorName: vendorName,
        excelRowNum: excelRowNum,
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

    // 3. Create or update transactions (dedup based on noPesan + noBku + namaBarang)
    let txCreated = 0;
    let txUpdated = 0;
    let txSkipped = 0;
    
    // Build lookup map of existing transactions for this import batch
    // Key = noPesan + noBku + namaBarang (unique combination)
    // Fallback key = excelRowNum (for draft rows without noPesan/noBku)
    const existingTxMap = new Map<string, string>(); // key -> transaction id
    
    if (transactions.length > 0) {
      // Query existing transactions with matching noPesan+noBku+namaBarang
      const txsWithIdentity = transactions.filter((tx) => tx.noPesan || tx.noBku);
      if (txsWithIdentity.length > 0) {
        const existingTxs = await db.transaction.findMany({
          where: {
            OR: txsWithIdentity.map((tx) => ({
              noPesan: tx.noPesan || null,
              noBku: tx.noBku || null,
              namaBarang: tx.namaBarang || null,
            })),
          },
          select: { id: true, noPesan: true, noBku: true, namaBarang: true },
        });
        for (const ex of existingTxs) {
          const key = `${ex.noPesan || ""}|${ex.noBku || ""}|${ex.namaBarang || ""}`;
          existingTxMap.set(key, ex.id);
        }
      }
      
      // Query existing transactions with matching excelRowNum (for draft rows)
      const txsWithoutIdentity = transactions.filter((tx) => !tx.noPesan && !tx.noBku);
      if (txsWithoutIdentity.length > 0) {
        const excelRowNums = txsWithoutIdentity.map((tx) => tx.excelRowNum).filter((n) => n > 0);
        if (excelRowNums.length > 0) {
          const existingByRow = await db.transaction.findMany({
            where: { excelRowNum: { in: excelRowNums } },
            select: { id: true, excelRowNum: true },
          });
          for (const ex of existingByRow) {
            if (ex.excelRowNum) {
              existingTxMap.set(`row:${ex.excelRowNum}`, ex.id);
            }
          }
        }
      }
    }
    
    for (const tx of transactions) {
      const isComplete = tx.uraian || tx.namaBarang;
      const hasAmount = tx.jumlah > 0;

      const vendorId = tx.vendorName
        ? vendorIdMap.get(tx.vendorName) || null
        : null;

      // Determine status
      let status = "pending";
      if (!isComplete || !hasAmount) {
        status = "draft";
      } else if (tx.tglBayar) {
        status = "lunas";
      }

      // Build dedup key: noPesan + noBku + namaBarang
      // For rows without noPesan AND noBku (draft), use excelRowNum as fallback
      const hasIdentity = tx.noPesan || tx.noBku;
      const dedupKey = hasIdentity
        ? `${tx.noPesan || ""}|${tx.noBku || ""}|${tx.namaBarang || ""}`
        : `row:${tx.excelRowNum}`;
      const existingId = existingTxMap.get(dedupKey);

      const txData = {
        noUrut: tx.noUrut,
        noPesan: tx.noPesan || null,
        noBku: tx.noBku || null,
        kodeProgram: tx.kodeProgram || null,
        kodeRekening: tx.kodeRekening || null,
        tglPerencanaan: tx.tglPerencanaan,
        tglPesan: tx.tglPesan,
        tglBast: tx.tglBast,
        noBast: null,
        tglPeriksa: tx.tglPeriksa,
        tglBayar: tx.tglBayar,
        uraian: tx.uraian || "",
        namaBarang: tx.namaBarang || null,
        volume: tx.volume,
        satuan: tx.satuan || null,
        tarifHarga: tx.tarifHarga,
        jumlah: tx.jumlah,
        kategoriBelanja: tx.kategoriBelanja || null,
        spesifikasiBarang: tx.spesifikasiBarang || null,
        hargaToko1: tx.hargaToko1,
        hargaToko2: tx.hargaToko2,
        namaToko1: tx.namaToko1 || null,
        namaToko2: tx.namaToko2 || null,
        direkturToko1: tx.direkturToko1 || null,
        alamatToko1: tx.alamatToko1 || null,
        alamatToko2: tx.alamatToko2 || null,
        uraianKwitansi: tx.uraianKwitansi || null,
        namaPekerjaanKategori: tx.namaPekerjaanKategori || null,
        satuan2: tx.satuan2 || null,
        hargaSatuanSebelumPajak: tx.hargaSatuanSebelumPajak,
        jumlahHargaSebelumPajak: tx.jumlahHargaSebelumPajak,
        hargaTotalAsli: tx.hargaTotalAsli,
        totalHargaSebelumDPP: tx.totalHargaSebelumDPP,
        totalHargaAsli: tx.totalHargaAsli,
        alamatSuratBalasan: tx.alamatSuratBalasan || null,
        noHp: tx.noHp || null,
        realisasi: tx.jumlah,
        bulan: tx.bulan,
        tahun: 2025,
        masukBku: tx.tglBayar ? "MASUK BKU" : null,
        status: status,
        bpuCode: tx.bpuCode || null,
        vendorId: vendorId,
        excelRowNum: tx.excelRowNum,
      };

      if (existingId) {
        // UPDATE existing transaction (not duplicate)
        await db.transaction.update({
          where: { id: existingId },
          data: txData,
        });
        txUpdated++;
      } else {
        // CREATE new transaction
        const created = await db.transaction.create({ data: txData });
        existingTxMap.set(dedupKey, created.id);
        txCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: dataRows.length,
        transactionsImported: txCreated,
        transactionsUpdated: txUpdated,
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
