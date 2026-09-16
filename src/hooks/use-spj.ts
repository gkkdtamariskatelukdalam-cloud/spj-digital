"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DashboardData,
  Transaction,
  TransactionListResponse,
  Vendor,
  Product,
  Bpu,
  School,
  Document,
  ReportData,
} from "@/lib/types/spj";

// ============ Dashboard ============
export function useDashboard() {
  return useQuery({
    queryKey: ["spj-dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch("/api/spj/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

// ============ Transactions ============
interface TxQuery {
  bulan?: number;
  tahun?: number;
  vendorId?: string;
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export function useTransactions(query: TxQuery = {}) {
  const params = new URLSearchParams();
  if (query.bulan) params.set("bulan", String(query.bulan));
  if (query.tahun) params.set("tahun", String(query.tahun));
  if (query.vendorId) params.set("vendorId", query.vendorId);
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.offset) params.set("offset", String(query.offset));

  return useQuery({
    queryKey: ["spj-transactions", query],
    queryFn: async (): Promise<TransactionListResponse> => {
      const res = await fetch(`/api/spj/transactions?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load transactions");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useTransactionDetail(id: string | null) {
  return useQuery({
    queryKey: ["spj-transaction", id],
    queryFn: async (): Promise<{ transaction: Transaction & { documents: Document[] } } | null> => {
      if (!id) return null;
      const res = await fetch(`/api/spj/transactions/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load transaction");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Transaction>) => {
      const res = await fetch("/api/spj/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj-transactions"] });
      qc.invalidateQueries({ queryKey: ["spj-dashboard"] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Transaction>;
    }) => {
      const res = await fetch(`/api/spj/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj-transactions"] });
      qc.invalidateQueries({ queryKey: ["spj-dashboard"] });
      qc.invalidateQueries({ queryKey: ["spj-transaction"] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spj/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj-transactions"] });
      qc.invalidateQueries({ queryKey: ["spj-dashboard"] });
    },
  });
}

// ============ Vendors ============
export function useVendors(q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  return useQuery({
    queryKey: ["spj-vendors", q],
    queryFn: async (): Promise<{ items: Vendor[] }> => {
      const res = await fetch(`/api/spj/vendors?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      const res = await fetch("/api/spj/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-vendors"] }),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vendor> }) => {
      const res = await fetch(`/api/spj/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-vendors"] }),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spj/vendors/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-vendors"] }),
  });
}

// ============ Products ============
export function useProducts(q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  return useQuery({
    queryKey: ["spj-products", q, category],
    queryFn: async (): Promise<{ items: Product[] }> => {
      const res = await fetch(`/api/spj/products?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const res = await fetch("/api/spj/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const res = await fetch(`/api/spj/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spj/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-products"] }),
  });
}

// ============ BPU ============
export function useBpu(q?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  return useQuery({
    queryKey: ["spj-bpu", q],
    queryFn: async (): Promise<{ items: Bpu[] }> => {
      const res = await fetch(`/api/spj/bpu?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateBpu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Bpu>) => {
      const res = await fetch("/api/spj/bpu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-bpu"] }),
  });
}

export function useDeleteBpu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/spj/bpu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-bpu"] }),
  });
}

// ============ School ============
export function useSchool() {
  return useQuery({
    queryKey: ["spj-school"],
    queryFn: async (): Promise<{ item: School | null }> => {
      const res = await fetch("/api/spj/school", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404) return { item: null };
        throw new Error("Failed");
      }
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<School>) => {
      const res = await fetch("/api/spj/school", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["spj-school"] }),
  });
}

// ============ Reports ============
export function useReport(type: string, extraParams: Record<string, string> = {}) {
  const params = new URLSearchParams({ type, ...extraParams });
  return useQuery({
    queryKey: ["spj-report", type, extraParams],
    queryFn: async (): Promise<ReportData> => {
      const res = await fetch(`/api/spj/reports?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

// ============ Documents ============
export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Document>) => {
      const res = await fetch("/api/spj/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["spj-transactions"] });
      qc.invalidateQueries({ queryKey: ["spj-transaction"] });
      qc.invalidateQueries({ queryKey: ["spj-dashboard"] });
    },
  });
}
