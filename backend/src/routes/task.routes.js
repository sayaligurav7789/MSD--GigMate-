import { Router } from "express";
import jwt from "jsonwebtoken";
import * as c from "../controllers/task.controller.js";
import { authRequired, requireRole, requireVerified } from "../middleware/auth.js";
import { wrap } from "../utils/http.js";

// Optional auth: lets GET /tasks/:id show proposals to the task owner without forcing a login.
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        try {
            const p = jwt.verify(header.slice(7), process.env.JWT_SECRET);
            req.user = { userId: p.userId, role: p.role };
        } catch { /* treated as anonymous */ }
    }
    next();
}

export const taskRouter = Router();
taskRouter.get("/", wrap(c.listTasks));
taskRouter.get("/mine/list", authRequired, requireRole("client"), wrap(c.myTasks));
taskRouter.get("/:id", optionalAuth, wrap(c.getTask));
taskRouter.post("/", authRequired, requireRole("client"), requireVerified, wrap(c.createTask));
taskRouter.post("/:id/cancel", authRequired, requireRole("client"), wrap(c.cancelTask));
taskRouter.post("/:id/proposals", authRequired, requireRole("student"), requireVerified, wrap(c.createProposal));

export const proposalRouter = Router();
proposalRouter.use(authRequired);
proposalRouter.get("/mine", requireRole("student"), wrap(c.myProposals));
proposalRouter.post("/:id/withdraw", requireRole("student"), wrap(c.withdrawProposal));
proposalRouter.post("/:id/accept", requireRole("client"), requireVerified, wrap(c.acceptProposal));
proposalRouter.post("/:id/reject", requireRole("client"), wrap(c.rejectProposal));
