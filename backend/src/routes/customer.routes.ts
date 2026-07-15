import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireOwnedResource } from "../middleware/tenant.middleware";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  listCustomerPayments,
  recordPayment,
} from "../controllers/customer.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", listCustomers);
router.post("/", createCustomer);
router.put("/:id", requireOwnedResource("customer"), updateCustomer);
router.get("/:id/payments", requireOwnedResource("customer"), listCustomerPayments);
router.post("/:id/payments", requireOwnedResource("customer"), recordPayment);

export default router;