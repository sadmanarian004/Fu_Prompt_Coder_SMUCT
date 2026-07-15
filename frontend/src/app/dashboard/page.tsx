"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import apiClient from "../../lib/apiClient";

import { useAuth } from "../../hooks/useAuth";

import { useLanguage } from "../../context/LanguageContext";

interface DailySummary {
  text: string;
  textBn: string;
  generatedAt: string;
}

interface RevenuePoint {
  day: string;
  revenue: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

interface TopProduct {
  id: string;
  name: string;
  unitsSold: number;
}

// Fallback data so the dashboard renders meaningfully before the API is wired up
const FALLBACK_SUMMARY: DailySummary = {
  text: "Sales are up 12% from yesterday, led by Rice 5kg and Fresh Milk. Detergent Powder is your slowest mover this week — consider a bundle offer.",
  textBn:
    "গতকালের তুলনায় বিক্রি ১২% বেড়েছে, প্রধানত চাল ৫কেজি ও দুধ থেকে। ডিটারজেন্ট পাউডার সবচেয়ে ধীরে বিক্রি হচ্ছে — বান্ডেল অফার বিবেচনা করুন।",
  generatedAt: new Date().toISOString(),
};

const FALLBACK_REVENUE: RevenuePoint[] = [
  { day: "Mon", revenue: 8200 },
  { day: "Tue", revenue: 9100 },
  { day: "Wed", revenue: 7600 },
  { day: "Thu", revenue: 10400 },
  { day: "Fri", revenue: 11800 },
  { day: "Sat", revenue: 13200 },
  { day: "Sun", revenue: 9900 },
];

const FALLBACK_LOW_STOCK: LowStockItem[] = [
  { id: "1", name: "Detergent Powder 1kg", stock: 3, threshold: 10 },
  { id: "2", name: "Cooking Oil 2L", stock: 5, threshold: 8 },
  { id: "3", name: "Match Box (dozen)", stock: 2, threshold: 6 },
];

const FALLBACK_TOP_PRODUCTS: TopProduct[] = [
  { id: "1", name: "Rice 5kg", unitsSold: 46 },
  { id: "2", name: "Fresh Milk 1L", unitsSold: 38 },
  { id: "3", name: "Lux Soap", unitsSold: 31 },
];

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [summary, setSummary] = useState<DailySummary>(FALLBACK_SUMMARY);
  const [revenue, setRevenue] = useState<RevenuePoint[]>(FALLBACK_REVENUE);
  const [lowStock, setLowStock] = useState<LowStockItem[]>(FALLBACK_LOW_STOCK);
  const [topProducts, setTopProducts] =
    useState<TopProduct[]>(FALLBACK_TOP_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [summaryRes, revenueRes, lowStockRes, topRes] =
          await Promise.all([
            apiClient.get("/ai/insights/daily"),
            apiClient.get("/sales/revenue-trend"),
            apiClient.get("/products/low-stock"),
            apiClient.get("/sales/top-products"),
          ]);
        if (cancelled) return;
        setSummary(summaryRes.data);
        setRevenue(revenueRes.data);
        setLowStock(lowStockRes.data);
        setTopProducts(topRes.data);
      } catch {
        // API not reachable yet — keep fallback data so the page still demos well
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue = revenue.reduce((sum, p) => sum + p.revenue, 0);
  const totalDue = lowStock.length * 0; // placeholder until /customers/due-total exists

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">
          {language === "bn" ? "আজকের সারসংক্ষেপ" : "Today's overview"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {language === "bn"
            ? "আপনার দোকানের অবস্থা এক নজরে।"
            : "Your shop, at a glance."}
        </p>
      </div>

      {/* AI DAILY SUMMARY — sticky note styling matches the landing page motif */}
      <div className="relative rounded-lg border border-gold/30 bg-surface px-6 py-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          {language === "bn" ? "এআই সারসংক্ষেপ" : "AI Daily Summary"}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/90">
          {loading
            ? "…"
            : language === "bn"
            ? summary.textBn
            : summary.text}
        </p>
      </div>

      {/* STAT STRIP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={language === "bn" ? "এই সপ্তাহের বিক্রি" : "Revenue this week"}
          value={`৳${totalRevenue.toLocaleString()}`}
          accent="taka"
        />
        <StatCard
          label={language === "bn" ? "কম মজুদ পণ্য" : "Low-stock items"}
          value={String(lowStock.length)}
          accent="rust"
        />
        <StatCard
          label={language === "bn" ? "সর্বাধিক বিক্রিত" : "Top product"}
          value={topProducts[0]?.name ?? "—"}
          accent="gold"
        />
      </div>

      {/* REVENUE TREND */}
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-medium">
          {language === "bn" ? "সাপ্তাহিক বিক্রির ধারা" : "Weekly revenue trend"}
        </h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenue}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E3A008" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E3A008" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                stroke="#9FB3A6"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#1B3A2C",
                  border: "1px solid #3A5245",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#F3ECDD" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#E3A008"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LOW STOCK + TOP PRODUCTS */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-medium">
            {language === "bn" ? "কম মজুদ সতর্কতা" : "Low-stock alerts"}
          </h2>
          <ul className="mt-4 space-y-3">
            {lowStock.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b border-line/50 pb-3 text-sm last:border-0 last:pb-0"
              >
                <span>{item.name}</span>
                <span className="font-mono text-rust">
                  {item.stock}/{item.threshold}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-medium">
            {language === "bn" ? "সর্বাধিক বিক্রিত পণ্য" : "Top-selling products"}
          </h2>
          <ul className="mt-4 space-y-3">
            {topProducts.map((product, i) => (
              <li
                key={product.id}
                className="flex items-center justify-between border-b border-line/50 pb-3 text-sm last:border-0 last:pb-0"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {product.name}
                </span>
                <span className="font-mono text-taka">
                  {product.unitsSold} sold
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "gold" | "taka" | "rust";
}) {
  const accentClass = {
    gold: "text-gold",
    taka: "text-taka",
    rust: "text-rust",
  }[accent];

  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-2 font-display text-xl font-semibold ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}