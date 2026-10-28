import { Router } from "express";
import * as c from "../controllers/admin.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { wrap } from "../utils/http.js";

const router = Router();
router.use(authRequired, requireRole("admin"));
router.get("/stats", wrap(c.stats));
router.get("/users", wrap(c.listUsers));
router.post("/users/:id/verification", wrap(c.reviewVerification));
router.post("/users/:id/ban", wrap(c.setBan));
router.get("/reports", wrap(c.listReports));
router.post("/reports/:id/resolve", wrap(c.resolveReport));
router.get("/flagged-messages", wrap(c.flaggedMessages));
export default router;
