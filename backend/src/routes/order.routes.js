import { Router } from "express";
import * as c from "../controllers/order.controller.js";
import { authRequired, requireRole, requireVerified } from "../middleware/auth.js";
import { wrap } from "../utils/http.js";

const router = Router();
router.use(authRequired);

router.get("/", wrap(c.listMyOrders));
router.post("/", requireRole("client"), requireVerified, wrap(c.createOrder));
router.get("/:id", wrap(c.getOrder));
router.post("/:id/accept", requireRole("student"), wrap(c.acceptOrder));
router.post("/:id/decline", wrap(c.declineOrder)); // student declines, or client cancels (pending only)
router.post("/:id/deliver", requireRole("student"), wrap(c.deliverOrder));
router.post("/:id/approve", requireRole("client"), wrap(c.approveOrder));
router.post("/:id/revision", requireRole("client"), wrap(c.requestRevision));
router.post("/:id/dispute", wrap(c.openDispute));
router.get("/:id/messages", wrap(c.listMessages));
router.post("/:id/messages", wrap(c.sendMessage));
router.post("/:id/review", wrap(c.createReview));

export default router;
