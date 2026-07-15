import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";

type OwnedModel = "product" | "customer" | "sale";

/**
 * Guards routes like PUT/DELETE /products/:id so that a valid JWT for Shop A
 * can never read or mutate a resource that actually belongs to Shop B — even
 * if the attacker guesses or enumerates another shop's resource id.
 *
 * authMiddleware only proves *who* the request is (which shop); this proves
 * the specific resource in the URL belongs to that same shop.
 */
export function requireOwnedResource(model: OwnedModel) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const shopId = req.auth?.shopId;

    if (!id || !shopId) {
      return res.status(400).json({ message: "Missing resource id." });
    }

    try {
      const record = await (prisma[model] as any).findUnique({
        where: { id },
        select: { shopId: true },
      });

      if (!record || record.shopId !== shopId) {
        // 404, not 403 — don't reveal whether the id exists in another shop
        return res.status(404).json({ message: "Resource not found." });
      }

      next();
    } catch (err) {
      console.error(`[tenant.middleware] ownership check failed for ${model}:`, err);
      return res.status(500).json({ message: "Couldn't verify resource access." });
    }
  };
}