import { Router } from "express";
import { createReport } from "../controllers/report.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { wrap } from "../utils/http.js";

const router = Router();
router.post("/", authRequired, requireRole("student", "client"), wrap(createReport));
export default router;
