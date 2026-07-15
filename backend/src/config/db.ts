import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across serverless invocations to avoid
// exhausting Aiven's MySQL connection pool on cold starts (Section 8.5).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;