import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireOwnedResource } from "../middleware/tenant.middleware";
import {
  listProducts,
  listLowStockProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";

const router = Router();

router.use(authMiddleware);

// NOTE: /low-stock must come before /:id or Express will try to treat
// "low-stock" as a product id.
router.get("/low-stock", listLowStockProducts);
router.get("/", listProducts);
router.post("/", createProduct);
router.put("/:id", requireOwnedResource("product"), updateProduct);
router.delete("/:id", requireOwnedResource("product"), deleteProduct);

export default router;