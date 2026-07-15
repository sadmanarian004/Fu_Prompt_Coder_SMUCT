"use client";

import Link from "next/link";
import { useState } from "react";

const ledgerEntries = [
  { item: "Lux Soap (12pc)", type: "sale", amount: "৳480" },
  { item: "Rina Akter — baki paid", type: "credit", amount: "৳1,200" },
  { item: "Fresh Milk 1L (20pc)", type: "sale", amount: "৳1,600" },
  { item: "Karim Mia — new baki", type: "due", amount: "৳650" },
  { item: "Parachute Oil (6pc)", type: "sale", amount: "৳870" },
  { item: "Rice 5kg (10 bag)", type: "sale", amount: "৳3,400" },
];

const features = [
  {
    no: "01",
    title: "Inventory that flags itself",
    body: "Stock levels update with every sale. When something runs low, DokanKhata AI tells you before the shelf goes empty — not after.",
  },
  {
    no: "02",
    title: "Baki Khata, digitized",
    body: "The credit notebook your customers know, now unforgettable. Track dues, partial payments, and send reminders without the torn pages.",
  },
  {
    no: "03",
    title: "Ask your shop a question",
    body: "‘কোন পণ্য কম বিক্রি হয়েছে?’ — ask in Bangla or English and get a plain answer, generated from your own sales data.",
  },
  {
    no: "04",
    title: "Invoices in one tap",
    body: "Every sale becomes a downloadable PDF receipt automatically. No more handwritten slips that fade or go missing.",
  },
];

export default function HomePage() {
  const [language, setLanguage] = useState<"en" | "bn">("en");

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "bn" : "en"));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* NAV */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              Dokan<span className="text-emerald-400">Khata</span>
            </span>
            <span className="rounded-full border border-zinc-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              AI
            </span>
          </div>
          <nav className="hidden items-center gap-8 font-medium text-sm text-zinc-400 md:flex">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ai" className="hover:text-white transition-colors">AI Assistant</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 font-mono text-xs font-semibold text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
            >
              বাং / EN
            </button>
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-400 hover:text-white sm:block transition-colors"
            >
              {language === "bn" ? "লগ ইন" : "Log in"}
            </Link>
            <Link 
  href="/dashboard" 
  className="rounded-md bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
>Dashboard</Link>
            

            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
            >
              {language === "bn" ? "শুরু করুন" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            {language === "bn" ? "বাংলাদেশের দোকানের জন্য তৈরি" : "Built for Bangladesh's dokans"}
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            {language === "bn" ? (
              <>
                আপনার বাকি খাতা,
                <br />
                <span className="text-emerald-400">ডিজিটাল</span> এবং স্মার্ট।
              </>
            ) : (
              <>
                Your baki khata,
                <br />
                <span className="text-emerald-400">digitized</span> — and smarter.
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-400">
            One bilingual dashboard for stock, sales, invoices, and customer
            credit. An AI assistant reads your numbers so you don't have to
            — and answers back in your own language.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Start free — no card needed
            </Link>
            <a
              href="#ai"
              className="text-sm font-semibold text-white underline decoration-zinc-800 underline-offset-4 hover:decoration-emerald-400 transition-all"
            >
              See the AI assistant →
            </a>
          </div>
          <dl className="mt-12 flex gap-10 border-t border-zinc-900 pt-6 font-mono text-sm">
            <div>
              <dt className="text-2xl font-bold text-white">৳0</dt>
              <dd className="text-zinc-500 mt-0.5">setup cost</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-white">2</dt>
              <dd className="text-zinc-500 mt-0.5">languages, always</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-white">24/7</dt>
              <dd className="text-zinc-500 mt-0.5">AI on your ledger</dd>
            </div>
          </dl>
        </div>

        {/* LEDGER MOCKUP — signature element */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-30 blur-xl transition group-hover:opacity-50" />
          <div className="relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/20 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-5 py-3.5">
              <span className="text-sm font-semibold text-zinc-400">
                Today's Khata
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden">
              <div className="absolute left-5 top-0 h-full w-[1px] bg-red-500/20 dashed" />
              <ul className="animate-ledgerScroll absolute w-full px-5 pt-4 font-mono text-sm">
                {[...ledgerEntries, ...ledgerEntries].map((e, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b border-zinc-900/50 py-3 pl-4"
                  >
                    <span className="text-zinc-300">{e.item}</span>
                    <span
                      className={`font-semibold ${
                        e.type === "due"
                          ? "text-rose-400"
                          : e.type === "credit"
                          ? "text-emerald-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {e.amount}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent" />
            </div>
          </div>
          
          {/* AI insight sticky note */}
          <div className="absolute -bottom-6 -left-6 max-w-[240px] rounded-xl border border-emerald-500/20 bg-zinc-900 p-4 shadow-2xl shadow-black/80 animate-popIn">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              AI Insight
            </p>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-zinc-300">
              Rice 5kg is your fastest mover this week — restock before Friday.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-zinc-900 bg-zinc-900/10">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold text-white md:text-3xl tracking-tight">
            Everything on one page of the ledger
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.no} className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-8 hover:border-zinc-800 transition-all">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">{f.no}</span>
                <h3 className="mt-4 text-lg font-bold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SHOWCASE */}
      <section id="ai" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              AI Business Assistant
            </p>
            <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl tracking-tight">
              Ask it what you'd ask a trusted accountant
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Every question is answered from your shop's own data — no
              generic advice, no spreadsheet required. Ask in Bangla, get an
              answer in Bangla.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-6 flex flex-col gap-4">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-emerald-500/10 border border-emerald-500/10 px-4 py-3 text-sm text-emerald-300 font-medium">
              কোন পণ্য কম বিক্রি হয়েছে এই মাসে?
            </div>
            <div className="mr-auto max-w-[85%] rounded-2xl rounded-tl-none border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-zinc-300">
              এই মাসে <span className="text-emerald-400 font-bold">Detergent Powder</span> সবচেয়ে
              কম বিক্রি হয়েছে — মাত্র ৪ প্যাকেট। দাম কমিয়ে বা বান্ডেল অফার
              দিয়ে দেখতে পারেন।
            </div>
          </div>
        </div>
      </section>

      {/* CTA / FOOTER */}
      <section id="pricing" className="border-t border-zinc-900 bg-gradient-to-b from-transparent to-zinc-900/20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Close the paper ledger. Open DokanKhata.
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Free to start. No English required.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
          >
            Create your shop
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8 bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 font-mono text-xs text-zinc-500 md:flex-row">
          <span>© {new Date().getFullYear()} DokanKhata AI · Feni University</span>
          <span className="bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 font-semibold text-zinc-400">FU_Prompt_Coder — CSE Fest 2026</span>
        </div>
      </footer>
    </div>
  );
}