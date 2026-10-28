import { z } from "zod";
import { Order } from "../models/Order.js";
import { Gig } from "../models/Gig.js";
import { Message } from "../models/Message.js";
import { Review } from "../models/Review.js";
import { Report } from "../models/Report.js";
import { User, PUBLIC_USER_FIELDS } from "../models/User.js";
import { HttpError, assert } from "../utils/http.js";
import { scanText, maskText } from "../utils/fraudFilter.js";
import { AUTO_RELEASE_DAYS } from "../constants.js";
import { holdFunds, returnHold, completeOrder, cancelOrder, recomputeTrust } from "../services/escrow.js";

const DAY = 24 * 60 * 60 * 1000;

const createOrderSchema = z.object({
    gigId: z.string().min(1),
    requirements: z.string().max(1000).optional().default(""),
});

// ---- helpers ---------------------------------------------------------------------------

async function loadOrder(req, { allowAdmin = false } = {}) {
    const order = await Order.findById(req.params.id);
    assert(order, 404, "Order not found");
    const uid = req.user.userId;
    const isClient = order.client.toString() === uid;
    const isStudent = order.student.toString() === uid;
    const isAdmin = allowAdmin && req.user.role === "admin";
    assert(isClient || isStudent || isAdmin, 403, "Forbidden");
    return { order, isClient, isStudent };
}

// If the client never responds to a delivery, funds are released to the student.
async function autoReleaseIfOverdue(order) {
    if (order.status === "delivered" && order.delivery?.deliveredAt &&
        Date.now() - order.delivery.deliveredAt.getTime() > AUTO_RELEASE_DAYS * DAY) {
        try {
            return await completeOrder(order._id);
        } catch {
            return order; // already settled by a concurrent request
        }
    }
    return order;
}

const populateOrder = (q) =>
    q.populate("gig", "title category price deliveryDays")
        .populate("task", "title category budget")
        .populate("client", PUBLIC_USER_FIELDS)
        .populate("student", PUBLIC_USER_FIELDS);

// ---- handlers --------------------------------------------------------------------------

export async function createOrder(req, res) {
    const { gigId, requirements } = createOrderSchema.parse(req.body);
    const scan = scanText(requirements);
    if (scan.flagged) {
        throw new HttpError(400, "Please keep links, contact details and payment info out of the requirements. Use the in-app chat.", { reasons: scan.reasons });
    }
    const gig = await Gig.findById(gigId);
    assert(gig && gig.isActive, 404, "Gig not available");
    assert(gig.student.toString() !== req.user.userId, 400, "You cannot order your own gig");

    await holdFunds(req.user.userId, gig.price, `Escrow for "${gig.title}"`);
    try {
        const order = await Order.create({
            gig: gig._id,
            title: gig.title,
            client: req.user.userId,
            student: gig.student,
            price: gig.price,
            requirements,
            deadline: new Date(Date.now() + gig.deliveryDays * DAY),
            status: "pending",
            escrow: { status: "held", amount: gig.price },
        });
        res.status(201).json({ order });
    } catch (err) {
        await returnHold(req.user.userId, gig.price, "Refund: order could not be created");
        throw err;
    }
}

export async function listMyOrders(req, res) {
    const filter = req.user.role === "client" ? { client: req.user.userId } : { student: req.user.userId };
    let orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
    const overdue = orders.filter((o) => o.status === "delivered");
    if (overdue.length) {
        await Promise.all(overdue.map((o) => autoReleaseIfOverdue(o)));
        orders = await populateOrder(Order.find(filter).sort({ createdAt: -1 }));
    }
    res.json({ orders });
}

export async function getOrder(req, res) {
    const { order } = await loadOrder(req, { allowAdmin: true });
    await autoReleaseIfOverdue(order);
    const full = await populateOrder(Order.findById(order._id));
    const reviews = await Review.find({ order: order._id });
    res.json({ order: full, reviews, autoReleaseDays: AUTO_RELEASE_DAYS });
}

export async function acceptOrder(req, res) {
    const { order, isStudent } = await loadOrder(req);
    assert(isStudent, 403, "Only the freelancer can accept");
    assert(order.status === "pending", 400, "Order is not waiting for acceptance");
    order.status = "in-progress";
    await order.save();
    res.json({ order });
}

export async function declineOrder(req, res) {
    const { order, isStudent, isClient } = await loadOrder(req);
    assert(isStudent || isClient, 403, "Forbidden");
    assert(order.status === "pending", 400, "Only pending orders can be declined or cancelled");
    res.json({ order: await cancelOrder(order._id) });
}

const deliverSchema = z.object({
    note: z.string().min(3).max(1000),
    link: z.string().url().max(500).optional().or(z.literal("")),
});

export async function deliverOrder(req, res) {
    const { order, isStudent } = await loadOrder(req);
    assert(isStudent, 403, "Only the freelancer can deliver");
    assert(order.status === "in-progress", 400, "Order is not in progress");
    const { note, link } = deliverSchema.parse(req.body);
    order.delivery = { note, link: link || undefined, deliveredAt: new Date() };
    order.status = "delivered";
    await order.save();
    res.json({ order });
}

export async function approveOrder(req, res) {
    const { order, isClient } = await loadOrder(req);
    assert(isClient, 403, "Only the client can approve");
    assert(order.status === "delivered", 400, "Nothing to approve yet");
    res.json({ order: await completeOrder(order._id) });
}

export async function requestRevision(req, res) {
    const { order, isClient } = await loadOrder(req);
    assert(isClient, 403, "Only the client can request a revision");
    assert(order.status === "delivered", 400, "Nothing to revise yet");
    assert(order.revisions < 2, 400, "Maximum of 2 revisions reached. Approve the work or open a dispute.");
    const { note } = z.object({ note: z.string().min(3).max(500) }).parse(req.body);
    await postMessage(order, req.user.userId, `Revision requested: ${note}`, req.userDoc);
    order.revisions += 1;
    order.status = "in-progress";
    await order.save();
    res.json({ order });
}

const disputeSchema = z.object({ reason: z.string().min(3).max(80), details: z.string().max(1000).optional().default("") });

export async function openDispute(req, res) {
    const { order, isClient } = await loadOrder(req);
    assert(["in-progress", "delivered"].includes(order.status), 400, "A dispute can only be opened on active orders");
    const { reason, details } = disputeSchema.parse(req.body);
    order.status = "disputed";
    await order.save();
    const report = await Report.create({
        type: "dispute",
        reporter: req.user.userId,
        target: isClient ? order.student : order.client,
        order: order._id,
        reason,
        details,
    });
    res.status(201).json({ order, report });
}

// ---- chat (with fraud filter) ----------------------------------------------------------

async function postMessage(order, senderId, rawText, senderDoc) {
    const scan = scanText(rawText);
    let text = rawText;
    let warning;
    if (scan.flagged) {
        text = maskText(rawText);
        if (text === rawText) text = "[message hidden: sharing payment or contact details outside GigMate is not allowed]";
        warning = "Your message contained contact/payment details or links, which are not allowed. It was masked and flagged for admin review.";
        await User.updateOne({ _id: senderId }, { $inc: { "stats.fraudStrikes": 1 } });
        await recomputeTrust(senderId);
    }
    const message = await Message.create({
        order: order._id,
        sender: senderId,
        text,
        flagged: scan.flagged,
        flagReasons: scan.reasons,
        originalText: scan.flagged ? rawText : undefined,
    });
    return { message, warning };
}

export async function listMessages(req, res) {
    const { order } = await loadOrder(req, { allowAdmin: true });
    const messages = await Message.find({ order: order._id }).sort({ createdAt: 1 }).limit(500);
    res.json({ messages });
}

export async function sendMessage(req, res) {
    const { order } = await loadOrder(req);
    assert(!["completed", "cancelled"].includes(order.status), 400, "This order is closed");
    const { text } = z.object({ text: z.string().trim().min(1).max(1000) }).parse(req.body);
    const { message, warning } = await postMessage(order, req.user.userId, text, req.userDoc);
    res.status(201).json({ message, warning });
}

// ---- reviews ---------------------------------------------------------------------------

export async function createReview(req, res) {
    const { order, isClient } = await loadOrder(req);
    assert(order.status === "completed", 400, "You can review an order once it is completed");
    const { rating, comment } = z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional().default(""),
    }).parse(req.body);
    const reviewee = isClient ? order.student : order.client;
    const exists = await Review.findOne({ order: order._id, reviewer: req.user.userId });
    assert(!exists, 409, "You already reviewed this order");
    const review = await Review.create({ order: order._id, reviewer: req.user.userId, reviewee, rating, comment: maskText(comment) });

    const [agg] = await Review.aggregate([
        { $match: { reviewee } },
        { $group: { _id: "$reviewee", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await User.updateOne({ _id: reviewee }, { $set: { "stats.ratingAvg": Math.round(agg.avg * 10) / 10, "stats.ratingCount": agg.count } });
    await recomputeTrust(reviewee);
    res.status(201).json({ review });
}
