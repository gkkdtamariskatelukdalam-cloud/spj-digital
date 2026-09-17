"use client";

import { useState } from "react";
import { Loader2, X, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialUsername: string;
  onUpdated?: (info: { name: string; username: string }) => void;
}

/**
 * Self-service profile editor.
 *
 * Authenticated users (admin OR regular user) can update:
 *   - Display name
 *   - Username (must remain unique)
 *   - Password (requires `currentPassword` confirmation)
 *
 * Submits to PUT /api/profile. On success, calls onUpdated() so the parent
 * can refresh the displayed username/name in the top-right user menu.
 */
export function ProfileEditor({
  open,
  onOpenChange,
  initialName,
  initialUsername,
  onUpdated,
}: ProfileEditorProps) {
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields when modal opens (so re-opening shows latest state)
  function handleOpenChange(next: boolean) {
    if (next) {
      setName(initialName);
      setUsername(initialUsername);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // Validate password confirmation if new password provided
    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          currentPassword: newPassword ? currentPassword : undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }
      toast.success("Profil berhasil diperbarui");
      onUpdated?.({ name: data.user.name, username: data.user.username });
      handleOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profil Saya</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pf-name">Nama Tampilan</Label>
            <Input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pf-username">Username</Label>
            <Input
              id="pf-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <p className="text-[11px] text-muted-foreground">
              Username harus unik. Jika diubah, anda akan tetap login dengan
              session lama hingga logout.
            </p>
          </div>

          <div className="border-t pt-4 mt-2">
            <p className="text-xs font-medium mb-2 text-slate-700 dark:text-slate-300">
              Ganti Password (opsional)
            </p>
            <div className="space-y-2">
              <div>
                <Label htmlFor="pf-current" className="text-xs">
                  Password Saat Ini
                </Label>
                <Input
                  id="pf-current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="wajib diisi jika ganti password"
                />
              </div>
              <div>
                <Label htmlFor="pf-new" className="text-xs">
                  Password Baru (min. 6 karakter)
                </Label>
                <Input
                  id="pf-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="pf-confirm" className="text-xs">
                  Konfirmasi Password Baru
                </Label>
                <Input
                  id="pf-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" /> Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" /> Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
