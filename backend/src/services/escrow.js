// Simulated wallet + escrow. In production this would sit on top of a licensed payment
// gateway (e.g. Razorpay in test mode); the rest of the app only talks to these functions.
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { HttpError } from "../utils/http.js";
import { computeTrustScore } from "../utils/trust.js";

export async function recomputeTrust(userId) {
    const u = await User.findById(userId);
    if (!u) return;
    await User.updateOne({ _id: userId }, { $set: { trustScore: computeTrustScore(u) } });
}

async function credit(userId, amount, type, orderId, note) {
    const updated = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } }, { new: true });
    await Transaction.create({ user: userId, type, amount, balanceAfter: updated.walletBalance, order: orderId, note });
    return updated;
}

export const topUp = (userId, amount) => credit(userId, amount, "topup", undefined, "Wallet top-up (test mode)");

export async function withdraw(userId, amount) {
    const updated = await User.findOneAndUpdate(
        { _id: userId, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true },
    );
    if (!updated) throw new HttpError(402, "Insufficient wallet balance");
    await Transaction.create({ user: userId, type: "withdraw", amount: -amount, balanceAfter: updated.walletBalance, note: "Withdrawal (simulated)" });
    return updated;
}

// Move money out of the client's wallet into escrow. Atomic: fails if the balance is too low.
export async function holdFunds(clientId, amount, orderNote) {
    const updated = await User.findOneAndUpdate(
        { _id: clientId, walletBalance: { $gte: amount } },
        { $inc: { walletBalance: -amount } },
        { new: true },
    );
    if (!updated) {
        throw new HttpError(402, "Insufficient wallet balance. Add funds to your wallet first.", { code: "INSUFFICIENT_FUNDS" });
    }
    await Transaction.create({ user: clientId, type: "escrow_hold", amount: -amount, balanceAfter: updated.walletBalance, note: orderNote });
}

export const returnHold = (clientId, amount, note) => credit(clientId, amount, "refund", undefined, note);

// The status filter makes release/refund idempotent: only a "held" escrow can be settled, once.
export async function releaseEscrow(orderId) {
    const order = await Order.findOneAndUpdate(
        { _id: orderId, "escrow.status": "held" },
        { $set: { "escrow.status": "released" } },
        { new: true },
    );
    if (!order) throw new HttpError(409, "Escrow for this order was already settled");
    await credit(order.student, order.escrow.amount, "escrow_release", order._id, `Payment for "${order.title}"`);
    return order;
}

export async function refundEscrow(orderId) {
    const order = await Order.findOneAndUpdate(
        { _id: orderId, "escrow.status": "held" },
        { $set: { "escrow.status": "refunded" } },
        { new: true },
    );
    if (!order) throw new HttpError(409, "Escrow for this order was already settled");
    await credit(order.client, order.escrow.amount, "refund", order._id, `Refund for "${order.title}"`);
    return order;
}

// Marks an order completed, pays the student, and updates their reputation stats.
export async function completeOrder(orderId) {
    const order = await releaseEscrow(orderId);
    const onTime = !order.deadline || !order.delivery?.deliveredAt || order.delivery.deliveredAt <= order.deadline;
    order.status = "completed";
    order.completedAt = new Date();
    await order.save();
    await User.updateOne({ _id: order.student }, { $inc: { "stats.completedOrders": 1, "stats.onTimeOrders": onTime ? 1 : 0 } });
    await recomputeTrust(order.student);
    return order;
}

export async function cancelOrder(orderId) {
    const order = await refundEscrow(orderId);
    order.status = "cancelled";
    await order.save();
    return order;
}
