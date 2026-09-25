"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BospItem {
  id: string;
  tahun: string;
  isActive: boolean;
  transactionCount: number;
  createdAt: string;
}

export function BospManagement() {
  const qc = useQueryClient();
  const [newTahun, setNewTahun] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ bospList: BospItem[] }>({
    queryKey: ["bosp"],
    queryFn: async () => {
      const res = await fetch("/api/bosp");
      if (!res.ok) throw new Error("Gagal memuat BOSP");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tahun: string) => {
      const res = await fetch("/api/bosp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bosp"] });
      setNewTahun("");
      toast.success("BOSP berhasil ditambahkan");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bosp/${id}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      return data.bosp;
    },
    onSuccess: (bosp: any) => {
      qc.invalidateQueries({ queryKey: ["bosp"] });
      toast.success(`${bosp.tahun} diaktifkan`);
      // Reload to refresh all data with new active BOSP
      setTimeout(() => window.location.reload(), 500);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bosp/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bosp"] });
      toast.success("BOSP berhasil dihapus");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTahun.trim()) return;
    setError(null);
    // Validate format: "BOSP YYYY"
    if (!/^BOSP\s+\d{4}$/.test(newTahun.trim())) {
      setError("Format: 'BOSP 2025' (huruf besar)");
      return;
    }
    createMutation.mutate(newTahun.trim());
  }

  function handleDelete(id: string, tahun: string) {
    if (confirm(`Hapus ${tahun}? Data transaksi terkait juga akan terhapus.`)) {
      deleteMutation.mutate(id);
    }
  }

  const bospList = data?.bospList ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">BOSP (Tahun Anggaran)</h2>
        <p className="text-xs text-muted-foreground">
          Kelola tahun anggaran BOSP. Hanya 1 tahun yang aktif dalam satu waktu.
        </p>
      </div>

      {/* Add new */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tambah BOSP Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="bosp-tahun" className="text-xs">Nama BOSP</Label>
              <Input
                id="bosp-tahun"
                value={newTahun}
                onChange={(e) => setNewTahun(e.target.value)}
                placeholder="BOSP 2026"
                className="text-sm"
              />
            </div>
            <Button type="submit" size="sm" disabled={createMutation.isPending || !newTahun.trim()}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Tambah
            </Button>
          </form>
          {error && (
            <p className="text-xs text-rose-600 mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nama BOSP</th>
              <th className="text-center font-medium px-3 py-2">Transaksi</th>
              <th className="text-center font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : bospList.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-xs text-muted-foreground py-6">
                  Belum ada BOSP.
                </td>
              </tr>
            ) : (
              bospList.map((b) => (
                <tr key={b.id} className="border-t hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-3 py-2 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {b.tahun}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center text-xs">{b.transactionCount}</td>
                  <td className="px-3 py-2 text-center">
                    {b.isActive ? (
                      <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-mono text-[10px]">
                        AKTIF
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                        NONAKTIF
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!b.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => activateMutation.mutate(b.id)}
                          disabled={activateMutation.isPending}
                          className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="Aktifkan"
                        >
                          <Check className="h-3.5 w-3.5 mr-0.5" />
                          Aktifkan
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(b.id, b.tahun)}
                        disabled={deleteMutation.isPending || b.isActive}
                        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        ⚠️ Mengaktifkan BOSP lain akan memuat ulang halaman. Data transaksi
        terikat ke BOSP yang aktif.
      </p>
    </div>
  );
}
