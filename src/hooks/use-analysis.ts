"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Summary,
  SheetDetail,
  VbaModule,
} from "@/lib/types/analysis";

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: async (): Promise<Summary> => {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSheetDetail(sheetName: string | null) {
  return useQuery({
    queryKey: ["sheet", sheetName],
    queryFn: async (): Promise<SheetDetail | null> => {
      if (!sheetName) return null;
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetName }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load sheet");
      return res.json();
    },
    enabled: !!sheetName,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVbaModules() {
  return useQuery({
    queryKey: ["vba"],
    queryFn: async (): Promise<VbaModule[]> => {
      const res = await fetch("/api/vba", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load VBA");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
