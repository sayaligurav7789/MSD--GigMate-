import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import gigRoutes from "./routes/gig.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { taskRouter, proposalRouter } from "./routes/task.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import adminRoutes from "./routes/admin.routes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? true,
    credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "gigmate-api" });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tasks", taskRouter);
app.use("/api/proposals", proposalRouter);
app.use("/api/wallet", walletRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
// Serve built frontend in production (when dist exists)
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get(/^\/(?!api).*/, (_req, res) => {
        res.sendFile(path.join(frontendDist, "index.html"));
    });
}
// 404 (API only)
app.use("/api", (_req, res) => {
    res.status(404).json({ message: "Not found" });
});
// Error handler
app.use((err, _req, res, _next) => {
    if (err?.name === "ZodError") {
        const first = err.errors?.[0];
        return res.status(400).json({
            message: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Validation error",
            errors: err.errors,
        });
    }
    if (err?.name === "CastError") {
        return res.status(400).json({ message: "Invalid id" });
    }
    const status = err.status || 500;
    if (status >= 500)
        console.error("[error]", err);
    res.status(status).json({
        message: status >= 500 ? "Internal server error" : err.message,
        ...(err.code ? { code: err.code } : {}),
        ...(err.reasons ? { reasons: err.reasons } : {}),
        ...(err.errors ? { errors: err.errors } : {}),
    });
});
export default app;
