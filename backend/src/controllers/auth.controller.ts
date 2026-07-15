import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";
import { hashPassword, verifyPassword, issueToken } from "../services/auth.service";

const registerSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required."),
  ownerName: z.string().trim().min(1, "Your name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  language: z.enum(["en", "bn"]).default("en"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

/**
 * POST /api/v1/auth/register
 * Section 7.1 "Shop Onboarding" — creates the Shop and its first Owner
 * account together in a single transaction, then logs them straight in.
 */
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { shopName, ownerName, email, password, language } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  try {
    const passwordHash = await hashPassword(password);

    const { shop, user } = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { name: shopName, language },
      });
      const user = await tx.user.create({
        data: {
          shopId: shop.id,
          name: ownerName,
          email,
          passwordHash,
          role: "OWNER",
        },
      });
      return { shop, user };
    });

    const token = issueToken({ userId: user.id, shopId: shop.id, role: "OWNER" });
    return res.status(201).json({ token });
  } catch (err) {
    console.error("[auth.controller] register failed:", err);
    return res.status(500).json({ message: "Couldn't create your shop. Please try again." });
  }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = issueToken({
      userId: user.id,
      shopId: user.shopId,
      role: user.role,
    });
    return res.json({ token });
  } catch (err) {
    console.error("[auth.controller] login failed:", err);
    return res.status(500).json({ message: "Couldn't log in right now. Please try again." });
  }
}