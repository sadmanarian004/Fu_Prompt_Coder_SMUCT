import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getDailySummary,
  askShopQuestion,
  getInsightHistory,
} from "../controllers/ai.controller";

const router = Router();

router.use(authMiddleware);

router.get("/insights/daily", getDailySummary);
router.post("/insights/query", askShopQuestion);
router.get("/insights/history", getInsightHistory);

export default router;