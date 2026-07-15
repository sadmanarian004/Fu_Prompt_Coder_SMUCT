import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/db";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().default(""),
});

const paymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero."),
  method: z.enum(["cash", "mobile_banking"]),
});

function mapCustomerToDTO(customer: {
  id: string;
  name: string;
  phone: string;
  dueBalance: number;
  lastPaymentDate: Date | null;
}) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    dueBalance: customer.dueBalance,
    lastPaymentDate: customer.lastPaymentDate,
  };
}

function mapPaymentToDTO(payment: {
  id: string;
  customerId: string;
  amount: number;
  method: string;
  date: Date;
}) {
  return {
    id: payment.id,
    customerId: payment.customerId,
    amount: payment.amount,
    method: payment.method.toLowerCase() as "cash" | "mobile_banking",
    date: payment.date,
  };
}

/**
 * GET /api/v1/customers
 */
export async function listCustomers(req: Request, res: Response) {
  const shopId = req.auth!.shopId;

  const customers = await prisma.customer.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
  });

  return res.json(customers.map(mapCustomerToDTO));
}

/**
 * POST /api/v1/customers
 * New customers always start with a zero due balance — dues only accrue
 * through a credit sale (see sale.controller.ts's createSale).
 */
export async function createCustomer(req: Request, res: Response) {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const shopId = req.auth!.shopId;
  const customer = await prisma.customer.create({
    data: { shopId, ...parsed.data, dueBalance: 0 },
  });

  return res.status(201).json(mapCustomerToDTO(customer));
}

/**
 * PUT /api/v1/customers/:id
 * Ownership of :id already verified by requireOwnedResource('customer').
 * Only name/phone are editable here — dueBalance changes only through
 * a credit sale or a recorded payment, never a direct edit.
 */
export async function updateCustomer(req: Request, res: Response) {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { id } = req.params;
  const customer = await prisma.customer.update({
    where: { id },
    data: parsed.data,
  });

  return res.json(mapCustomerToDTO(customer));
}

/**
 * GET /api/v1/customers/:id/payments
 * Recent payment history shown inside RecordPaymentModal.
 */
export async function listCustomerPayments(req: Request, res: Response) {
  const { id } = req.params;

  const payments = await prisma.payment.findMany({
    where: { customerId: id },
    orderBy: { date: "desc" },
    take: 20,
  });

  return res.json(payments.map(mapPaymentToDTO));
}

/**
 * POST /api/v1/customers/:id/payments
 * Records a partial or full payment against the due balance. Rejects any
 * amount greater than what's actually owed, re-checked server-side even
 * though the frontend already caps the input.
 */
export async function recordPayment(req: Request, res: Response) {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { id: customerId } = req.params;
  const { amount, method } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });

      if (amount > customer.dueBalance) {
        throw Object.assign(
          new Error("Payment can't exceed the outstanding due balance."),
          { status: 400 }
        );
      }

      const payment = await tx.payment.create({
        data: {
          customerId,
          amount,
          method: method === "cash" ? "CASH" : "MOBILE_BANKING",
        },
      });

      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          dueBalance: { decrement: amount },
          lastPaymentDate: payment.date,
        },
      });

      return { customer: updatedCustomer, payment };
    });

    return res.status(201).json({
      customer: mapCustomerToDTO(result.customer),
      payment: mapPaymentToDTO(result.payment),
    });
  } catch (err: any) {
    const status = err?.status ?? 500;
    console.error("[customer.controller] recordPayment failed:", err);
    return res.status(status).json({
      message: status === 500 ? "Couldn't record the payment. Please try again." : err.message,
    });
  }
}