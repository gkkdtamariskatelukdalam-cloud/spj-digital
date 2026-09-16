// Types for SPJ (Surat Pertanggungjawaban) application

export interface School {
  id: string;
  name: string;
  npsn: string | null;
  address: string | null;
  principalName: string | null;
  principalNip: string | null;
  principalRank: string | null;
  treasurerName: string | null;
  treasurerNip: string | null;
  treasurerRank: string | null;
  goodsManagerName: string | null;
  goodsManagerNip: string | null;
  goodsManagerRank: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  year: number;
}

export interface Vendor {
  id: string;
  name: string;
  owner: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  spec: string | null;
  unit: string | null;
  price: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bpu {
  id: string;
  code: string;
  noPesan: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  transactionId: string;
  type: string;
  docNumber: string | null;
  docDate: string | null;
  amount: number | null;
  filePath: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  noUrut: number | null;
  noPesan: string | null;
  noBku: string | null;
  kodeProgram: string | null;
  kodeRekening: string | null;
  tglPerencanaan: string | null;
  tglPesan: string | null;
  tglBast: string | null;
  noBast: string | null;
  tglPeriksa: string | null;
  tglBayar: string | null;
  uraian: string;
  namaBarang: string | null;
  volume: number;
  satuan: string | null;
  tarifHarga: number;
  jumlah: number;
  kategoriBelanja: string | null;
  spesifikasiBarang: string | null;
  hargaToko1: number | null;
  hargaToko2: number | null;
  namaToko1: string | null;
  namaToko2: string | null;
  direkturToko1: string | null;
  alamatToko1: string | null;
  alamatToko2: string | null;
  uraianKwitansi: string | null;
  namaPekerjaanKategori: string | null;
  satuan2: string | null;
  hargaSatuanSebelumPajak: number | null;
  jumlahHargaSebelumPajak: number | null;
  hargaTotalAsli: number | null;
  totalHargaSebelumDPP: number | null;
  totalHargaAsli: number | null;
  alamatSuratBalasan: string | null;
  noHp: string | null;
  realisasi: number;
  bulan: number | null;
  tahun: number;
  masukBku: string | null;
  status: string;
  bpuCode: string | null;
  vendorId: string | null;
  vendor: Vendor | null;
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  school: School | null;
  stats: {
    totalAmount: number;
    totalRealisasi: number;
    transactionCount: number;
    vendorCount: number;
    productCount: number;
    bpuCount: number;
    documentCount: number;
    statusBreakdown: {
      lunas: number;
      pending: number;
      total: number;
    };
  };
  monthly: Array<{
    month: number;
    monthName: string;
    total: number;
    count: number;
  }>;
  byVendor: Array<{
    vendorId: string;
    name: string;
    total: number;
  }>;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
  totalAmount: number;
  limit: number;
  offset: number;
}

export interface ReportData {
  type: string;
  data: unknown;
}

// ============ Document Groups ============

export interface DocumentGroupItem {
  id: string;
  uraian: string;
  namaBarang: string | null;
  volume: number;
  satuan: string | null;
  tarifHarga: number;
  jumlah: number;
  realisasi: number;
  noBku: string | null;
  noBast: string | null;
  tglBayar: string | null;
}

export interface DocumentGroup {
  key: string;
  noPesan: string;
  noBku: string;
  bpuCode: string;
  tglPesan: string | null;
  tglBast: string | null;
  tglBayar: string | null;
  bulan: number | null;
  tahun: number;
  vendorId: string | null;
  vendorName: string | null;
  vendorOwner: string | null;
  vendorPhone: string | null;
  vendorAddress: string | null;
  items: DocumentGroupItem[];
  totalJumlah: number;
  totalRealisasi: number;
  itemCount: number;
}

export interface DocumentGroupsResponse {
  groups: DocumentGroup[];
  summary: {
    totalGroups: number;
    totalAllAmount: number;
    withVendor: number;
    withoutVendor: number;
  };
}

// ============ Letterhead (KOP Surat) Settings ============

export interface LetterheadSettings {
  id: string;
  logoPath: string | null;
  logoWidth: number;
  logoHeight: number;
  logoOffsetX: number;
  logoOffsetY: number;
  logo2Path: string | null;
  logo2Width: number;
  logo2Height: number;
  logo2OffsetX: number;
  logo2OffsetY: number;
  kopMode: string; // "single" or "dual"
  fontFamily: string;
  lineSpacing: number;
  line1Text: string;
  line1Bold: boolean;
  line1Size: number;
  line2Text: string;
  line2Bold: boolean;
  line2Size: number;
  line3Text: string;
  line3Bold: boolean;
  line3Size: number;
  line4Text: string;
  line4Bold: boolean;
  line4Size: number;
  line5Text: string;
  line5Bold: boolean;
  line5Size: number;
  line6Text: string;
  line6Bold: boolean;
  line6Size: number;
  line7Text: string;
  line7Bold: boolean;
  line7Size: number;
  showBottomLine: boolean;
  bottomLineWidth: number;
}
