"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "../lib/apiClient";

export interface DailySummary {
  text: string;
  textBn: string;
  generatedAt: string;
}

export interface InsightMessage {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

const FALLBACK_SUMMARY: DailySummary = {
  text: "Sales are up 12% from yesterday, led by Rice 5kg and Fresh Milk. Detergent Powder is your slowest mover this week — consider a bundle offer.",
  textBn:
    "গতকালের তুলনায় বিক্রি ১২% বেড়েছে, প্রধানত চাল ৫কেজি ও দুধ থেকে। ডিটারজেন্ট পাউডার সবচেয়ে ধীরে বিক্রি হচ্ছে — বান্ডেল অফার বিবেচনা করুন।",
  generatedAt: new Date().toISOString(),
};

function makeLocalId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAIInsights() {
  const [summary, setSummary] = useState<DailySummary>(FALLBACK_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [history, setHistory] = useState<InsightMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<DailySummary>("/ai/insights/daily")
      .then(({ data }) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        /* keep fallback summary for the demo */
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    apiClient
      .get<InsightMessage[]>("/ai/insights/history")
      .then(({ data }) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        /* no prior history reachable yet — start with an empty chat */
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const askQuestion = useCallback(async (question: string) => {
    setAsking(true);
    setAskError(null);

    try {
      const { data } = await apiClient.post<{ answer: string }>(
        "/ai/insights/query",
        { question }
      );
      const message: InsightMessage = {
        id: makeLocalId(),
        question,
        answer: data.answer,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [...prev, message]);
      return message;
    } catch (err: any) {
      if (err?.response) {
        setAskError(
          err.response?.data?.message ??
            "The AI assistant couldn't answer that right now."
        );
        return null;
      }
      // No response — API not reachable yet, keep the demo usable
      const message: InsightMessage = {
        id: makeLocalId(),
        question,
        answer:
          "I can't reach the AI service right now, but once connected I'll answer using your shop's real sales, stock, and due data.",
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [...prev, message]);
      return message;
    } finally {
      setAsking(false);
    }
  }, []);

  return {
    summary,
    summaryLoading,
    history,
    historyLoading,
    askQuestion,
    asking,
    askError,
  };
}