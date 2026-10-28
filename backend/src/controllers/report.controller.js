import { z } from "zod";
import { Report } from "../models/Report.js";
import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { assert } from "../utils/http.js";

// A user reports another user (fake client, phishing attempt, harassment...).
export async function createReport(req, res) {
    const data = z.object({
        targetUserId: z.string().min(1),
        orderId: z.string().optional(),
        reason: z.enum(["fake-client", "phishing-link", "asked-for-bank-details", "off-platform-payment", "harassment", "plagiarism", "other"]),
        details: z.string().max(1000).optional().default(""),
    }).parse(req.body);
    assert(data.targetUserId !== req.user.userId, 400, "You cannot report yourself");
    const target = await User.findById(data.targetUserId);
    assert(target, 404, "User not found");
    if (data.orderId) {
        const order = await Order.findById(data.orderId);
        assert(order && [order.client.toString(), order.student.toString()].includes(req.user.userId), 403, "You are not part of that order");
    }
    const report = await Report.create({
        type: "report",
        reporter: req.user.userId,
        target: target._id,
        order: data.orderId,
        reason: data.reason,
        details: data.details,
    });
    res.status(201).json({ report });
}
