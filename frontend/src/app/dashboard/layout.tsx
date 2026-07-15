"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", labelBn: "সারসংক্ষেপ" },
  { href: "/dashboard/inventory", label: "Inventory", labelBn: "মজুদ" },
  { href: "/dashboard/sales", label: "Sales", labelBn: "বিক্রয়" },
  { href: "/dashboard/customers", label: "Customers", labelBn: "গ্রাহক" },
  { href: "/dashboard/ai-insights", label: "AI Insights", labelBn: "এআই ইনসাইট" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
  // Commented out temporarily so you can view the dashboard without a backend auth session
  // if (!loading && !isAuthenticated) {
  //   router.push("/login");
  // }
}, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-sm">
        Loading shop…
      </div>
    );
  }

  // If not authenticated, let the useEffect handle redirection
  //if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      {/* SIDEBAR */}
      <aside className="hidden w-64 flex-col border-r border-zinc-800 px-5 py-6 md:flex bg-zinc-900/50">
        <Link href="/" className="font-sans text-lg font-semibold tracking-tight">
          Dokan<span className="text-amber-500">Khata</span>
        </Link>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-zinc-800 text-amber-500 font-medium"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                {language === "bn" ? item.labelBn : item.label}
              </Link>
            );
          })}
        </nav>
        {user?.role === "OWNER" && (
          <span className="mb-3 font-mono text-[10px] uppercase tracking-widest text-emerald-500">
            Owner access
          </span>
        )}
        <button
          onClick={logout}
          className="rounded-md border border-zinc-800 px-3 py-2 text-left text-sm text-zinc-400 hover:border-red-500/30 hover:text-red-400 transition-colors"
        >
          {language === "bn" ? "লগ আউট" : "Log out"}
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/30">
          <span className="font-mono text-xs text-zinc-500">
            {new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-BD", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
          <button
            onClick={toggleLanguage}
            className="rounded border border-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-colors"
          >
            বাং / EN
          </button>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}