import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createSale,
  listRecentSales,
  getRevenueTrend,
  getTopProducts,
} from "../controllers/sale.controller";

const router = Router();

router.use(authMiddleware);

router.get("/recent", listRecentSales);
router.get("/revenue-trend", getRevenueTrend);
router.get("/top-products", getTopProducts);
router.post("/", createSale);

export default router;