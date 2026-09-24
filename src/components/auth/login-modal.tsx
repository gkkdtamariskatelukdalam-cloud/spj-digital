"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  Loader2,
  AlertCircle,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from "lucide-react";

/**
 * Full-screen login overlay shown when the user is not authenticated.
 *
 * Displays the app logo (uploaded via Master Data → Pengaturan → App Logo)
 * above the login form. If no logo is set, falls back to the Wallet icon.
 *
 * Submits credentials to NextAuth via `signIn("credentials", ...)`.
 */
export function LoginModal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize appLogo from localStorage (if previously fetched) so the logo
  // shows immediately on first render — no Wallet-icon flash. SSR-safe
  // (returns null on server, populated after hydration).
  const [appLogo, setAppLogo] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem("appLogo") || null;
    } catch {
      return null;
    }
  });

  // Fetch app logo on mount (public endpoint, no auth needed).
  // Updates state + localStorage so next page load can use it immediately.
  useEffect(() => {
    fetch("/api/app-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.appLogo) {
          setAppLogo(data.appLogo);
          try {
            localStorage.setItem("appLogo", data.appLogo);
          } catch {
            // localStorage might be full or disabled — ignore
          }
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      username: username.trim(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Username atau password salah, atau akun nonaktif");
      return;
    }
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-rose-600 to-amber-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-xl bg-white backdrop-blur flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
              {appLogo ? (
                <img
                  src={appLogo}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-[11px] font-extrabold tracking-tight text-rose-600 leading-none text-center">
                  SPJ
                  <br />
                  DIGITAL
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SPJ Digital</h1>
              <p className="text-xs text-white/80">
                SMA Negeri 1 Telukdalam · BOSP 2025
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
                placeholder="masukkan username"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
                placeholder="masukkan password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-medium text-sm py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-2">
            Hubungi administrator untuk mendapatkan akun akses.
          </p>
        </form>
      </div>
    </div>
  );
}
