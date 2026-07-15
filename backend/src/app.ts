import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import aiRoutes from "./routes/ai.routes";
import productRoutes from "./routes/product.routes";
import saleRoutes from "./routes/sale.routes";
import customerRoutes from "./routes/customer.routes";
import invoiceRoutes from "./routes/invoice.routes";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ status: "ok", service: "dokankhata-api" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/sales", saleRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/invoices", invoiceRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;