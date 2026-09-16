import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function safeName(name: string) {
  return name.replace(/ /g, "_").replace(/\//g, "-").replace(/\\/g, "-");
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "analysis", "summary.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const sheets = data.sheets.map((s: { name: string; type: string; purpose: string; category: string; formulas_count: number; non_empty_cells: number; max_row: number; max_col: number }) => ({
      name: s.name,
      type: s.type,
      purpose: s.purpose,
      category: s.category,
      formulas_count: s.formulas_count,
      non_empty_cells: s.non_empty_cells,
      max_row: s.max_row,
      max_col: s.max_col,
    }));
    return NextResponse.json({ sheets }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load sheets: " + (e as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { sheetName } = await req.json();
    if (!sheetName) {
      return NextResponse.json({ error: "sheetName required" }, { status: 400 });
    }
    const safe = safeName(sheetName);
    const filePath = path.join(
      process.cwd(),
      "public",
      "analysis",
      `sheet_${safe}.json`
    );
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Sheet not found" }, { status: 404 });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed: " + (e as Error).message },
      { status: 500 }
    );
  }
}
