import { Router } from "express";
import * as c from "../controllers/verification.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { wrap } from "../utils/http.js";

const router = Router();
router.use(authRequired, requireRole("student", "client"));
router.get("/", wrap(c.status));
router.post("/send-otp", wrap(c.sendOtp));
router.post("/verify-otp", wrap(c.confirmOtp));
router.post("/submit-id", wrap(c.submitId));
export default router;
