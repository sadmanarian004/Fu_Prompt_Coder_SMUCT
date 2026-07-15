/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import prisma from "../config/db";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Add at least one item."),
  customerName: z.string().trim().default("Walk-in customer"),
  paymentType: z.enum(["paid", "credit"]),
});

interface SaleItemSnapshot {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

function mapSaleToDTO(sale: {
  id: string;
  invoiceNo: string;
  customerName: string;
  items: unknown;
  totalAmount: number;
  paymentType: string;
  timestamp: Date;
}) {
  return {
    id: sale.id,
    invoiceNo: sale.invoiceNo,
    customerName: sale.customerName,
    items: sale.items as unknown as SaleItemSnapshot[],
    total: sale.totalAmount,
    paymentType: sale.paymentType.toLowerCase() as "paid" | "credit",
    createdAt: sale.timestamp,
  };
}

/**
 * POST /api/v1/sales
 * Section 7.1 "Sales & Invoicing". Prices and stock are re-derived from the
 * database inside a transaction rather than trusted from the request body,
 * so a tampered client can't under-charge or oversell stock.
 */
export async function createSale(req: Request, res: Response) {
  const parsed = createSaleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { items, customerName, paymentType } = parsed.data;
  const shopId = req.auth!.shopId;
  const staffId = req.auth!.userId;

  try {
    const sale = await prisma.$transaction(async (tx) => {
      // Fetch and lock-in current prices/stock for every product in the cart
      const products = await tx.product.findMany({
        where: { shopId, id: { in: items.map((i) => i.productId) } },
      });

      if (products.length !== items.length) {
        throw Object.assign(new Error("One or more products no longer exist."), { status: 400 });
      }

      const snapshot: SaleItemSnapshot[] = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        if (product.stockQuantity < item.quantity) {
          throw Object.assign(
            new Error(`Not enough stock for ${product.name} (only ${product.stockQuantity} left).`),
            { status: 400 }
          );
        }
        snapshot.push({
          productId: product.id,
          name: product.name,
          unitPrice: product.unitPrice,
          quantity: item.quantity,
        });
        totalAmount += product.unitPrice * item.quantity;

        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      // Credit (baki) sales must be tied to a real Customer so the due
      // balance is trackable; find-or-create by name within this shop.
      let customerId: string | null = null;
      if (paymentType === "credit") {
        if (!customerName.trim() || customerName === "Walk-in customer") {
          throw Object.assign(
            new Error("A customer name is required for a credit (baki) sale."),
            { status: 400 }
          );
        }
        const existing = await tx.customer.findFirst({
          where: { shopId, name: { equals: customerName.trim() } },
        });
        const customer = existing
          ? await tx.customer.update({
              where: { id: existing.id },
              data: { dueBalance: { increment: totalAmount } },
            })
          : await tx.customer.create({
              data: { shopId, name: customerName.trim(), dueBalance: totalAmount },
            });
        customerId = customer.id;
      }

      const saleCount = await tx.sale.count({ where: { shopId } });
      const invoiceNo = `INV-${String(saleCount + 1).padStart(4, "0")}`;

      return tx.sale.create({
        data: {
          shopId,
          staffId,
          customerId,
          invoiceNo,
          customerName: customerName.trim() || "Walk-in customer",
          items: snapshot as unknown as Prisma.InputJsonValue,
          totalAmount,
          paymentType: paymentType === "credit" ? "CREDIT" : "PAID",
        },
      });
    });

    return res.status(201).json(mapSaleToDTO(sale));
  } catch (err: any) {
    const status = err?.status ?? 500;
    console.error("[sale.controller] createSale failed:", err);
    return res.status(status).json({
      message: status === 500 ? "Couldn't record the sale. Please try again." : err.message,
    });
  }
}

/**
 * GET /api/v1/sales/recent
 */
export async function listRecentSales(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  const sales = await prisma.sale.findMany({
    where: { shopId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  return res.json(sales.map(mapSaleToDTO));
}

/**
 * GET /api/v1/sales/revenue-trend
 * Last 7 days of revenue, oldest to newest — feeds the dashboard's area chart.
 */
export async function getRevenueTrend(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { shopId, timestamp: { gte: sevenDaysAgo } },
    select: { timestamp: true, totalAmount: true },
  });

  const revenueByDay = new Map<string, number>();
  const dayLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    dayLabels.push(label);
    revenueByDay.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, 0);
  }

  for (const sale of sales) {
    const d = sale.timestamp;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + sale.totalAmount);
    }
  }

  const result = [...revenueByDay.entries()].map(([, revenue], i) => ({
    day: dayLabels[i],
    revenue,
  }));

  return res.json(result);
}

/**
 * GET /api/v1/sales/top-products
 * Tallies units sold from each sale's item snapshot over the last 30 days.
 */
export async function getTopProducts(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sales = await prisma.sale.findMany({
    where: { shopId, timestamp: { gte: thirtyDaysAgo } },
    select: { items: true },
  });

  const unitsByProduct = new Map<string, { id: string; name: string; unitsSold: number }>();
  for (const sale of sales) {
    const items = (sale.items as unknown as SaleItemSnapshot[]) ?? [];
    for (const item of items) {
      const existing = unitsByProduct.get(item.productId);
      if (existing) {
        existing.unitsSold += item.quantity;
      } else {
        unitsByProduct.set(item.productId, {
          id: item.productId,
          name: item.name,
          unitsSold: item.quantity,
        });
      }
    }
  }

  const ranked = [...unitsByProduct.values()].sort((a, b) => b.unitsSold - a.unitsSold);
  return res.json(ranked.slice(0, 5));
}