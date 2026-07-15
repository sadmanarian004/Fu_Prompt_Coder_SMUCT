"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Couldn't log in — check your email and password."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-12 selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="w-full max-w-md rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 shadow-2xl backdrop-blur-md">
        
        {/* LOGO */}
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            Dokan<span className="text-emerald-400">Khata</span>
            <span className="ml-1.5 rounded-full border border-zinc-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              AI
            </span>
          </Link>
        </div>

        {/* HEADER */}
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="mt-1.5 text-xs text-zinc-400">
          Log in to access your shop's synchronized digital ledger dashboard.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          
          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourshop.com"
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
              >
                Password
              </label>
              <Link 
                href="/forgot-password" 
                className="font-mono text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5 text-xs text-rose-400 leading-relaxed animate-popIn">
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/10"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* FOOTER REDIRECT */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          New to DokanKhata?{" "}
          <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
            Create your shop
          </Link>
        </p>
      </div>
    </main>
  );
}