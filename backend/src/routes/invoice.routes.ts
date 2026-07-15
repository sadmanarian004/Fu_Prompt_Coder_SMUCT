import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireOwnedResource } from "../middleware/tenant.middleware";
import { downloadInvoicePdf } from "../controllers/invoice.controller";

const router = Router();

router.use(authMiddleware);

router.get("/:id/pdf", requireOwnedResource("sale"), downloadInvoicePdf);

export default router;