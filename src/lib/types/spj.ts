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
  tglPesan: string | null;
  noPesan: string | null;
  tglBast: string | null;
  noBast: string | null;
  tglBayar: string | null;
  noBku: string | null;
  bpuCode: string | null;
  uraian: string;
  namaBarang: string | null;
  volume: number;
  satuan: string | null;
  tarifHarga: number;
  jumlah: number;
  realisasi: number;
  bulan: number | null;
  tahun: number;
  masukBku: string | null;
  status: string;
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
