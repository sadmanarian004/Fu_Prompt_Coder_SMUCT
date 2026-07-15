"use client";

import { useRef, useState, FormEvent, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { InsightMessage } from "../../../hooks/useAIInsights";

const SUGGESTED_QUESTIONS_EN = [
  "Which products sold the least this month?",
  "What should I restock this week?",
  "How much are customers overdue on their dues?",
];

const SUGGESTED_QUESTIONS_BN = [
  "এই মাসে কোন পণ্য কম বিক্রি হয়েছে?",
  "এই সপ্তাহে কী পুনরায় মজুদ করা উচিত?",
  "গ্রাহকদের কত টাকা বাকি আছে?",
];

interface ChatPanelProps {
  history: InsightMessage[];
  historyLoading: boolean;
  asking: boolean;
  askError: string | null;
  onAsk: (question: string) => Promise<InsightMessage | null>;
}

export default function ChatPanel({
  history,
  historyLoading,
  asking,
  askError,
  onAsk,
}: ChatPanelProps) {
  const { language } = useLanguage();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, asking]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || asking) return;
    setInput("");
    await onAsk(question);
  }

  const suggestions = language === "bn" ? SUGGESTED_QUESTIONS_BN : SUGGESTED_QUESTIONS_EN;

  return (
    <div className="flex h-[520px] flex-col rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-display text-lg font-medium">
          {language === "bn" ? "এআই ব্যবসায়িক সহকারী" : "AI Business Assistant"}
        </h2>
        <p className="text-xs text-muted">
          {language === "bn"
            ? "আপনার দোকানের তথ্য থেকে উত্তর দেয়।"
            : "Answers grounded in your shop's own data."}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {historyLoading ? (
          <p className="text-sm text-muted">
            {language === "bn" ? "লোড হচ্ছে…" : "Loading conversation…"}
          </p>
        ) : history.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {language === "bn"
                ? "কিছু জিজ্ঞাসা করে শুরু করুন:"
                : "Try asking one of these to get started:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => onAsk(q)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          history.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-surfaceAlt px-4 py-2.5 text-sm">
                {msg.question}
              </div>
              <div className="max-w-[85%] rounded-lg rounded-tl-none border border-gold/30 bg-ink px-4 py-2.5 text-sm leading-relaxed">
                {msg.answer}
              </div>
            </div>
          ))
        )}

        {asking && (
          <div className="max-w-[85%] rounded-lg rounded-tl-none border border-gold/30 bg-ink px-4 py-2.5 text-sm text-muted">
            {language === "bn" ? "ভাবছে…" : "Thinking…"}
          </div>
        )}
      </div>

      {askError && (
        <p className="border-t border-rust/30 bg-rust/5 px-5 py-2 text-xs text-rust">
          {askError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === "bn"
              ? "আপনার দোকান সম্পর্কে জিজ্ঞাসা করুন…"
              : "Ask something about your shop…"
          }
          className="flex-1 rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-muted/60 outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={asking || !input.trim()}
          className="rounded-md bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold/90 disabled:opacity-50"
        >
          {language === "bn" ? "পাঠান" : "Ask"}
        </button>
      </form>
    </div>
  );
}