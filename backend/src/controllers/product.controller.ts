/// <reference path="../types/express.d.ts" />
import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  category: z.string().trim().default(""),
  unitPrice: z.number().positive("Unit price must be greater than zero."),
  costPrice: z.number().min(0).default(0),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

/**
 * GET /api/v1/products
 * Every query here is scoped to req.auth.shopId — this is the actual
 * enforcement point for tenant isolation on list endpoints (the
 * tenant.middleware guard on :id routes covers single-resource access).
 */
export async function listProducts(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  const products = await prisma.product.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
  });

  return res.json(products);
}

/**
 * GET /api/v1/products/low-stock
 * Powers the dashboard's low-stock alert list and feeds shopSnapshot.service
 * for the AI daily summary.
 */
export async function listLowStockProducts(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  const products = await prisma.product.findMany({
    where: { shopId },
    select: { id: true, name: true, stockQuantity: true, lowStockThreshold: true },
  });

  const lowStock = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
  return res.json(lowStock);
}

/**
 * POST /api/v1/products
 */
export async function createProduct(req: Request, res: Response) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const shopId = req.auth!.shopId;
  const product = await prisma.product.create({
    data: {
      shopId,
      name: parsed.data.name,
      category: parsed.data.category,
      unitPrice: parsed.data.unitPrice,
      costPrice: parsed.data.costPrice,
      stockQuantity: parsed.data.stockQuantity,
      lowStockThreshold: parsed.data.lowStockThreshold,
    },
  });

  return res.status(201).json(product);
}

/**
 * PUT /api/v1/products/:id
 * Ownership of :id is already verified by requireOwnedResource('product')
 * before this handler runs.
 */
export async function updateProduct(req: Request, res: Response) {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { id } = req.params;
  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

  return res.json(product);
}

/**
 * DELETE /api/v1/products/:id
 */
export async function deleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.product.delete({ where: { id } });
  return res.status(204).send();
}