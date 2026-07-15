import { Request, Response } from "express";
// Replace lines 2-4 with these relative imports:
import prisma from "../config/db";
import { buildShopSnapshot } from "../services/shopSnapshot.service";
import { generateDailySummary, answerShopQuery } from "../services/gemini.service";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * GET /api/v1/ai/insights/daily
 *
 * Returns today's cached summary if one already exists in AIInsightLog
 * (Section 8.3 — "cached ... to avoid redundant API calls"), otherwise
 * aggregates fresh shop data, calls Gemini, and writes a new cache row.
 */
export async function getDailySummary(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  try {
    const todayStart = startOfDay(new Date());

    const cached = await prisma.aIInsightLog.findFirst({
      where: {
        shopId,
        promptType: "daily_summary",
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached) {
      const parsed = JSON.parse(cached.response);
      return res.json({
        text: parsed.en,
        textBn: parsed.bn,
        generatedAt: cached.createdAt,
      });
    }

    const snapshot = await buildShopSnapshot(shopId);
    const summary = await generateDailySummary(snapshot);

    const log = await prisma.aIInsightLog.create({
      data: {
        shopId,
        promptType: "daily_summary",
        response: JSON.stringify(summary),
      },
    });

    return res.json({
      text: summary.en,
      textBn: summary.bn,
      generatedAt: log.createdAt,
    });
  } catch (err) {
    console.error("[ai.controller] getDailySummary failed:", err);
    return res.status(502).json({
      message: "Couldn't generate today's AI summary. Please try again shortly.",
    });
  }
}

/**
 * POST /api/v1/ai/insights/query
 * Body: { question: string }
 *
 * Powers the AI Business Assistant chat panel (Section 7.1). Every question
 * gets a fresh snapshot since owners expect up-to-the-minute answers here,
 * unlike the once-a-day cached summary above.
 */
export async function askShopQuestion(req: Request, res: Response) {
  const shopId = req.auth!.shopId;
  const { question } = req.body as { question?: string };

  if (!question || !question.trim()) {
    return res.status(400).json({ message: "A question is required." });
  }

  try {
    const snapshot = await buildShopSnapshot(shopId);
    const answer = await answerShopQuery(snapshot, question.trim());

    await prisma.aIInsightLog.create({
      data: {
        shopId,
        promptType: "owner_query",
        prompt: question.trim(),
        response: answer,
      },
    });

    return res.json({ answer, language: snapshot.language });
  } catch (err) {
    console.error("[ai.controller] askShopQuestion failed:", err);
    return res.status(502).json({
      message: "The AI assistant couldn't answer that right now. Please try again.",
    });
  }
}

/**
 * GET /api/v1/ai/insights/history
 * Returns recent AIInsightLog entries for this shop (owner queries only),
 * so the chat panel can restore prior conversation on reload.
 */
export async function getInsightHistory(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  try {
    const logs = await prisma.aIInsightLog.findMany({
      where: { shopId, promptType: "owner_query" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.json(
      logs.reverse().map((log) => ({
        id: log.id,
        question: log.prompt,
        answer: log.response,
        createdAt: log.createdAt,
      }))
    );
  } catch (err) {
    console.error("[ai.controller] getInsightHistory failed:", err);
    return res.status(502).json({ message: "Couldn't load AI insight history." });
  }
}