import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

export type ShopLanguage = "en" | "bn";

// The aggregated slice of shop data the controller pulls via Prisma before
// calling this service — kept intentionally small so prompts stay cheap.
export interface ShopSnapshot {
  shopName: string;
  language: ShopLanguage;
  revenueToday: number;
  revenueThisWeek: number;
  lowStockItems: { name: string; stock: number; threshold: number }[];
  topProducts: { name: string; unitsSold: number }[];
  slowProducts: { name: string; unitsSold: number }[];
  totalOutstandingDue: number;
  customersWithDue: number;
}

export interface DailySummaryResult {
  en: string;
  bn: string;
}

function formatSnapshotForPrompt(snapshot: ShopSnapshot): string {
  const lowStockLine = snapshot.lowStockItems.length
    ? snapshot.lowStockItems
        .map((i) => `${i.name} (${i.stock}/${i.threshold})`)
        .join(", ")
    : "none";

  const topLine = snapshot.topProducts
    .map((p) => `${p.name} (${p.unitsSold} sold)`)
    .join(", ");

  const slowLine = snapshot.slowProducts.length
    ? snapshot.slowProducts.map((p) => `${p.name} (${p.unitsSold} sold)`).join(", ")
    : "none";

  return [
    `Shop: ${snapshot.shopName}`,
    `Revenue today: BDT ${snapshot.revenueToday}`,
    `Revenue this week: BDT ${snapshot.revenueThisWeek}`,
    `Low-stock items: ${lowStockLine}`,
    `Top-selling products: ${topLine || "none"}`,
    `Slowest-moving products: ${slowLine}`,
    `Total outstanding customer dues: BDT ${snapshot.totalOutstandingDue} across ${snapshot.customersWithDue} customers`,
  ].join("\n");
}

/**
 * Generates the automated daily/weekly summary shown on the dashboard
 * (Section 7.1 "Automated Daily/Weekly Summary"). Requests both languages in
 * a single call so the frontend's bn/en toggle doesn't need a second request,
 * and so exactly one row gets written to AIInsightLog per generation.
 */
export async function generateDailySummary(
  snapshot: ShopSnapshot
): Promise<DailySummaryResult> {
  const model = getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `You are the AI business assistant inside DokanKhata AI, a shop-management app for small retailers in Bangladesh.

Using ONLY the data below, write a short (2-3 sentence) daily business summary for the shop owner. Mention the most useful, actionable insight first (e.g. a low-stock warning or a notable sales trend). Be concrete and use the real numbers given. Do not invent data that isn't provided.

Shop data:
${formatSnapshotForPrompt(snapshot)}

Respond with ONLY a JSON object in this exact shape, no markdown fences, no extra text:
{"en": "<summary in natural English>", "bn": "<the same summary, naturally written in Bangla, not a literal translation>"}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.en === "string" && typeof parsed.bn === "string") {
      return { en: parsed.en, bn: parsed.bn };
    }
    throw new Error("Malformed summary shape");
  } catch {
    throw new Error("Gemini returned an unparseable summary response.");
  }
}

/**
 * Answers a free-form owner question (Section 7.1 "AI Business Assistant"),
 * e.g. "কোন পণ্য কম বিক্রি হয়েছে এই মাসে?" — answered in the shop's
 * preferred language, grounded only in the aggregated snapshot.
 */
export async function answerShopQuery(
  snapshot: ShopSnapshot,
  question: string
): Promise<string> {
  const model = getClient().getGenerativeModel({ model: GEMINI_MODEL });

  const languageInstruction =
    snapshot.language === "bn"
      ? "Reply naturally in Bangla, as a helpful shopkeeper's assistant would speak."
      : "Reply naturally in English, as a helpful shopkeeper's assistant would speak.";

  const prompt = `You are the AI business assistant inside DokanKhata AI, a shop-management app for small retailers in Bangladesh.

${languageInstruction} Keep the answer short and directly useful — 1-3 sentences. Use ONLY the shop data below; if the data doesn't cover what's asked, say so plainly instead of guessing.

Shop data:
${formatSnapshotForPrompt(snapshot)}

Owner's question: "${question}"`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}