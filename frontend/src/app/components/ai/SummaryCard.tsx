"use client";

import { useLanguage } from "../../../context/LanguageContext";
import { DailySummary } from "../../../hooks/useAIInsights";

interface SummaryCardProps {
  summary: DailySummary;
  loading: boolean;
}

export default function SummaryCard({ summary, loading }: SummaryCardProps) {
  const { language } = useLanguage();

  return (
    <div className="relative rounded-lg border border-gold/30 bg-surface px-6 py-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
          {language === "bn" ? "এআই সারসংক্ষেপ" : "AI Daily Summary"}
        </p>
        {!loading && (
          <p className="font-mono text-[10px] text-muted">
            {new Date(summary.generatedAt).toLocaleTimeString(
              language === "bn" ? "bn-BD" : "en-BD",
              { hour: "2-digit", minute: "2-digit" }
            )}
          </p>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/90">
        {loading ? "…" : language === "bn" ? summary.textBn : summary.text}
      </p>
    </div>
  );
}