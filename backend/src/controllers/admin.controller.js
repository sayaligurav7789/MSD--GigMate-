import { z } from "zod";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Task } from "../models/Task.js";
import { Report } from "../models/Report.js";
import { Message } from "../models/Message.js";
import { assert } from "../utils/http.js";
import { completeOrder, cancelOrder, recomputeTrust } from "../services/escrow.js";

export async function stats(_req, res) {
    const [users, pendingVerifications, openReports, flaggedMessages, openTasks, activeOrders, held] = await Promise.all([
        User.countDocuments({ role: { $ne: "admin" } }),
        User.countDocuments({ "verification.status": "pending" }),
        Report.countDocuments({ status: "open" }),
        Message.countDocuments({ flagged: true }),
        Task.countDocuments({ status: "open" }),
        Order.countDocuments({ status: { $in: ["pending", "in-progress", "delivered", "disputed"] } }),
        Order.aggregate([{ $match: { "escrow.status": "held" } }, { $group: { _id: null, total: { $sum: "$escrow.amount" } } }]),
    ]);
    res.json({ users, pendingVerifications, openReports, flaggedMessages, openTasks, activeOrders, escrowHeld: held[0]?.total || 0 });
}

export async function listUsers(req, res) {
    const { status, role, q } = req.query;
    const filter = { role: { $ne: "admin" } };
    if (status) filter["verification.status"] = status;
    if (role) filter.role = role;
    if (q) filter.$or = [{ name: new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }, { email: new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }];
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ users });
}

export async function reviewVerification(req, res) {
    const { approve, reason } = z.object({ approve: z.boolean(), reason: z.string().max(300).optional() }).parse(req.body);
    const user = await User.findById(req.params.id);
    assert(user && user.role !== "admin", 404, "User not found");
    assert(user.verification.status === "pending", 400, "No pending verification for this user");
    user.verification.status = approve ? "verified" : "rejected";
    user.verification.rejectionReason = approve ? undefined : reason || "ID proof could not be verified";
    user.verification.reviewedAt = new Date();
    await user.save();
    await recomputeTrust(user._id);
    res.json({ user });
}

export async function setBan(req, res) {
    const { banned } = z.object({ banned: z.boolean() }).parse(req.body);
    const user = await User.findById(req.params.id);
    assert(user && user.role !== "admin", 404, "User not found");
    user.isBanned = banned;
    await user.save();
    res.json({ user });
}

export async function listReports(req, res) {
    const { status = "open" } = req.query;
    const reports = await Report.find(status === "all" ? {} : { status })
        .populate("reporter", "name email role")
        .populate("target", "name email role isBanned stats trustScore")
        .populate("order", "title price status escrow client student")
        .sort({ createdAt: -1 })
        .limit(200);
    res.json({ reports });
}

// Dispute decisions move money; report decisions update the reported user.
export async function resolveReport(req, res) {
    const { decision, note } = z.object({
        decision: z.enum(["release", "refund", "dismiss", "warn", "ban"]),
        note: z.string().max(500).optional().default(""),
    }).parse(req.body);
    const report = await Report.findById(req.params.id);
    assert(report, 404, "Report not found");
    assert(report.status === "open", 400, "Already resolved");

    if (report.type === "dispute") {
        assert(["release", "refund"].includes(decision), 400, "Disputes are resolved with 'release' (pay the freelancer) or 'refund' (return to the client)");
        const order = await Order.findById(report.order);
        assert(order && order.status === "disputed", 400, "Order is not in dispute");
        if (decision === "release") await completeOrder(order._id);
        else await cancelOrder(order._id);
    } else {
        assert(!["release", "refund"].includes(decision), 400, "Use dismiss, warn or ban for user reports");
        if (decision !== "dismiss" && report.target) {
            await User.updateOne({ _id: report.target }, {
                $inc: { "stats.reportCount": 1 },
                ...(decision === "ban" ? { $set: { isBanned: true } } : {}),
            });
            await recomputeTrust(report.target);
        }
    }
    report.status = "resolved";
    report.resolution = { decision, note, resolvedBy: req.user.userId, resolvedAt: new Date() };
    await report.save();
    res.json({ report });
}

export async function flaggedMessages(_req, res) {
    const messages = await Message.find({ flagged: true })
        .select("+originalText")
        .populate("sender", "name email role stats")
        .sort({ createdAt: -1 })
        .limit(200);
    res.json({ messages });
}
