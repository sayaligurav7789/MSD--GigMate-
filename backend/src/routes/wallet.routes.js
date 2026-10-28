import { Router } from "express";
import * as c from "../controllers/wallet.controller.js";
import { authRequired, requireVerified } from "../middleware/auth.js";
import { wrap } from "../utils/http.js";

const router = Router();
router.use(authRequired);
router.get("/", wrap(c.getWallet));
router.post("/topup", requireVerified, wrap(c.addFunds));
router.post("/withdraw", requireVerified, wrap(c.withdrawFunds));
export default router;
