"use client";

import { useLanguage } from "../../../context/LanguageContext";
import { useAIInsights } from "../../../hooks/useAIInsights";
import SummaryCard from "../../components/ai/SummaryCard";
import ChatPanel from "../../components/ai/ChatPanel";

export default function AIInsightsPage() {
  const { language } = useLanguage();
  const {
    summary,
    summaryLoading,
    history,
    historyLoading,
    askQuestion,
    asking,
    askError,
  } = useAIInsights();

  return (
    <div className="space-y-6 text-zinc-100 p-2">
      {/* HEADER LAYER */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {language === "bn" ? "এআই ইনসাইট" : "AI Insights & Analytics"}
        </h1>
        <p className="mt-1 text-xs font-normal text-zinc-500">
          {language === "bn"
            ? "আপনার দোকানের ডেটা থেকে স্বয়ংক্রিয় সারসংক্ষেপ ও উত্তর।"
            : "Automated core engine vectors and responses compiled from local ledger datasets."}
        </p>
      </div>

      {/* CORE CONTROL PANELS */}
      <div className="grid grid-cols-1 gap-6">
        {/* EXECUTIVE SUMMARY CONTAINER */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-1 shadow-sm transition-all">
          <div className="border-b border-zinc-900/60 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {language === "bn" ? "ব্যবসায়িক ওভারভিউ" : "System Synthesis Summary"}
          </div>
          <div className="p-5">
            <SummaryCard summary={summary} loading={summaryLoading} />
          </div>
        </div>

        {/* DISTRIBUTED CONVERSATION ENGINE */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-1 shadow-sm">
          <div className="border-b border-zinc-900/60 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {language === "bn" ? "ইনসাইট অনুসন্ধান" : "Interactive Neural Query Interface"}
          </div>
          <div className="p-5">
            <ChatPanel
              history={history}
              historyLoading={historyLoading}
              asking={asking}
              askError={askError}
              onAsk={askQuestion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}