import prisma from "../config/db";
import { ShopSnapshot, ShopLanguage } from "./gemini.service";

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
};

export async function buildShopSnapshot(shopId: string): Promise<ShopSnapshot> {
  const shop = await prisma.shop.findUniqueOrThrow({
    where: { id: shopId },
    select: { name: true, language: true },
  });

  const todayStart = startOfDay(new Date());
  const weekStart = daysAgo(7);

  const [todaySales, weekSales, allProducts, dueAggregate, customersWithDue] =
    await Promise.all([
      prisma.sale.aggregate({
        where: { shopId, timestamp: { gte: todayStart } },
        _sum: { totalAmount: true },
      }),
      prisma.sale.findMany({
        where: { shopId, timestamp: { gte: weekStart } },
        select: { totalAmount: true, items: true },
      }),
      prisma.product.findMany({
        where: { shopId },
        select: { name: true, stockQuantity: true, lowStockThreshold: true },
      }),
      prisma.customer.aggregate({
        where: { shopId, dueBalance: { gt: 0 } },
        _sum: { dueBalance: true },
        _count: true,
      }),
      prisma.customer.count({ where: { shopId, dueBalance: { gt: 0 } } }),
    ]);

  // Prisma can't compare two columns (stockQuantity vs lowStockThreshold)
  // inside a `where` filter, so we fetch all products for the shop and
  // filter in JS — shop-level product counts are small enough for this
  // to stay cheap.
  const lowStockProducts = allProducts
    .filter((p) => p.stockQuantity <= p.lowStockThreshold)
    .slice(0, 10);

  const revenueThisWeek = weekSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Tally units sold per product across the week's sale line items to
  // surface top- and slow-moving products for the AI prompt.
  const unitsByProduct = new Map<string, number>();
  for (const sale of weekSales) {
    const items = (sale.items as { name: string; quantity: number }[]) ?? [];
    for (const item of items) {
      unitsByProduct.set(
        item.name,
        (unitsByProduct.get(item.name) ?? 0) + item.quantity
      );
    }
  }
  const ranked = [...unitsByProduct.entries()].sort((a, b) => b[1] - a[1]);
  const topProducts = ranked.slice(0, 3).map(([name, unitsSold]) => ({ name, unitsSold }));
  const slowProducts = ranked.slice(-3).map(([name, unitsSold]) => ({ name, unitsSold }));

  return {
    shopName: shop.name,
    language: shop.language as ShopLanguage,
    revenueToday: todaySales._sum.totalAmount ?? 0,
    revenueThisWeek,
    lowStockItems: lowStockProducts.map((p) => ({
      name: p.name,
      stock: p.stockQuantity,
      threshold: p.lowStockThreshold,
    })),
    topProducts,
    slowProducts,
    totalOutstandingDue: dueAggregate._sum.dueBalance ?? 0,
    customersWithDue,
  };
}