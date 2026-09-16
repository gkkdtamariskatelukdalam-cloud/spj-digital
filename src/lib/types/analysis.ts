// Types for the Excel analysis data

export interface FileInfo {
  name: string;
  type: string;
  password_protected: boolean;
  password: string;
  sheets_count: number;
  vba_modules_count: number;
  total_formulas: number;
  total_cells: number;
  organization: string;
  purpose: string;
  year: string;
}

export interface SheetHeader {
  col: string;
  col_idx: number;
  header: string;
}

export interface SheetCell {
  col: string;
  col_idx: number;
  formula: string;
  value: string;
  is_formula: boolean;
  is_array: boolean;
}

export interface SheetSampleRow {
  row: number;
  cells: SheetCell[];
}

export interface FormulaItem {
  cell: string;
  row: number;
  col: string;
  formula: string;
  value: string;
  type: "normal" | "array";
}

export interface SheetInfo {
  name: string;
  type: string;
  purpose: string;
  category: string;
  formulas_count: number;
  non_empty_cells: number;
  max_row: number;
  max_col: number;
}

export interface SheetDetail extends SheetInfo {
  headers: SheetHeader[];
  sample_rows: SheetSampleRow[];
  formulas: FormulaItem[];
}

export interface VbaModule {
  name: string;
  stream: string;
  code: string;
  sheet_target: string;
  purpose: string;
  is_empty: boolean;
  code_length: number;
}

export interface Summary {
  file_info: FileInfo;
  sheets: SheetInfo[];
  vba_modules: Array<{
    name: string;
    sheet_target: string;
    purpose: string;
    is_empty: boolean;
    code_length: number;
  }>;
}
