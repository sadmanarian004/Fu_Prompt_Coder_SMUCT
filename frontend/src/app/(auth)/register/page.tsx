"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(language === "bn" ? "পাসওয়ার্ড দুটি মেলেনি।" : "Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError(language === "bn" ? "পাসওয়ার্ডটি কমপক্ষে ৮ অক্ষরের হতে হবে।" : "Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ shopName, ownerName, email, password, language });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          (language === "bn" 
            ? "দোকান তৈরি করা যায়নি — আবার চেষ্টা করুন।" 
            : "Couldn't create your shop — please try again.")
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
          {language === "bn" ? "আপনার দোকান খুলুন" : "Open your shop"}
        </h1>
        <p className="mt-1.5 text-xs text-zinc-400">
          {language === "bn" ? "মাত্র এক মিনিট সময় লাগবে। কোন কার্ড প্রয়োজন নেই।" : "Takes about a minute. No credit card required."}
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          
          {/* SHOP NAME */}
          <div>
            <label
              htmlFor="shopName"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
            >
              {language === "bn" ? "দোকানের নাম" : "Shop name"}
            </label>
            <input
              id="shopName"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={language === "bn" ? "করিম স্টোর" : "Karim Store"}
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* OWNER NAME */}
          <div>
            <label
              htmlFor="ownerName"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
            >
              {language === "bn" ? "আপনার নাম" : "Your name"}
            </label>
            <input
              id="ownerName"
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={language === "bn" ? "আব্দুল করিম" : "Abdul Karim"}
              className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
            >
              {language === "bn" ? "ইমেইল এড্রেস" : "Email address"}
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

          {/* PASSWORDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
              >
                {language === "bn" ? "পাসওয়ার্ড" : "Password"}
              </label>
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
            <div>
              <label
                htmlFor="confirmPassword"
                className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500"
              >
                {language === "bn" ? "নিশ্চিত করুন" : "Confirm"}
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          {/* LANGUAGE SELECTOR */}
          <div>
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {language === "bn" ? "পছন্দসই ভাষা" : "System language"}
            </span>
            <div className="mt-2 flex gap-2">
              {(["en", "bn"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold tracking-wide transition-all ${
                    language === lang
                      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                      : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {lang === "en" ? "English" : "বাংলা"}
                </button>
              ))}
            </div>
          </div>

          {/* ERROR STATUS */}
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
            {submitting 
              ? (language === "bn" ? "আপনার দোকান তৈরি হচ্ছে…" : "Setting up your shop…") 
              : (language === "bn" ? "দোকান তৈরি করুন" : "Create your shop")}
          </button>
        </form>

        {/* FOOTER REDIRECT */}
        <p className="mt-6 text-center text-xs text-zinc-500">
          {language === "bn" ? "পূর্বেই অ্যাকাউন্ট তৈরি করেছেন?" : "Already have a shop?"}{" "}
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors">
            {language === "bn" ? "লগ ইন করুন" : "Log in"}
          </Link>
        </p>
      </div>
    </main>
  );
}