import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DokanKhata AI demo data…");

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const shop = await prisma.shop.create({
    data: {
      name: "Karim General Store",
      address: "Feni Sadar, Feni",
      language: "bn",
      users: {
        create: [
          { name: "Abdul Karim", email: "owner@dokankhata.demo", passwordHash, role: "OWNER" },
          { name: "Rafiq Islam", email: "staff@dokankhata.demo", passwordHash, role: "STAFF" },
        ],
      },
      products: {
        create: [
          { name: "Rice 5kg", category: "Grocery", unitPrice: 340, costPrice: 300, stockQuantity: 42, lowStockThreshold: 10 },
          { name: "Fresh Milk 1L", category: "Dairy", unitPrice: 80, costPrice: 65, stockQuantity: 18, lowStockThreshold: 15 },
          { name: "Detergent Powder 1kg", category: "Household", unitPrice: 210, costPrice: 170, stockQuantity: 3, lowStockThreshold: 10 },
          { name: "Lux Soap", category: "Personal Care", unitPrice: 40, costPrice: 30, stockQuantity: 60, lowStockThreshold: 20 },
          { name: "Cooking Oil 2L", category: "Grocery", unitPrice: 480, costPrice: 420, stockQuantity: 5, lowStockThreshold: 8 },
        ],
      },
      customers: {
        create: [
          { name: "Karim Mia", phone: "01712345678", dueBalance: 650 },
          { name: "Rina Akter", phone: "01898765432", dueBalance: 0, lastPaymentDate: new Date() },
          { name: "Jamal Uddin", phone: "01611223344", dueBalance: 1200 },
          { name: "Shirin Begum", phone: "01555667788", dueBalance: 340 },
        ],
      },
    },
    include: { products: true, customers: true, users: true },
  });

  const rice = shop.products.find((p) => p.name === "Rice 5kg")!;
  const milk = shop.products.find((p) => p.name === "Fresh Milk 1L")!;
  const oil = shop.products.find((p) => p.name === "Cooking Oil 2L")!;
  const owner = shop.users.find((u) => u.role === "OWNER")!;
  const karimMia = shop.customers.find((c) => c.name === "Karim Mia")!;
  const rina = shop.customers.find((c) => c.name === "Rina Akter")!;

  await prisma.sale.createMany({
    data: [
      {
        shopId: shop.id,
        staffId: owner.id,
        invoiceNo: "INV-0230",
        customerName: "Walk-in customer",
        items: [{ productId: rice.id, name: rice.name, unitPrice: rice.unitPrice, quantity: 2 }],
        totalAmount: rice.unitPrice * 2,
        paymentType: "PAID",
      },
      {
        shopId: shop.id,
        staffId: owner.id,
        customerId: karimMia.id,
        invoiceNo: "INV-0231",
        customerName: karimMia.name,
        items: [{ productId: oil.id, name: oil.name, unitPrice: oil.unitPrice, quantity: 1 }],
        totalAmount: oil.unitPrice,
        paymentType: "CREDIT",
      },
      {
        shopId: shop.id,
        staffId: owner.id,
        customerId: rina.id,
        invoiceNo: "INV-0232",
        customerName: rina.name,
        items: [{ productId: milk.id, name: milk.name, unitPrice: milk.unitPrice, quantity: 3 }],
        totalAmount: milk.unitPrice * 3,
        paymentType: "PAID",
      },
    ],
  });

  await prisma.payment.create({
    data: {
      customerId: rina.id,
      amount: 200,
      method: "CASH",
    },
  });

  console.log(`Seed complete. Log in with owner@dokankhata.demo / Password123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });