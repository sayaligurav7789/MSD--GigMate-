import { z } from "zod";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { MAX_TOPUP } from "../constants.js";
import { topUp, withdraw } from "../services/escrow.js";

export async function getWallet(req, res) {
    const user = await User.findById(req.user.userId).select("walletBalance");
    const transactions = await Transaction.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ balance: user.walletBalance, transactions });
}

// Test-mode top-up. Swap this for a Razorpay order + signature verification in production.
export async function addFunds(req, res) {
    const { amount } = z.object({ amount: z.number().int().min(10).max(MAX_TOPUP) }).parse(req.body);
    const user = await topUp(req.user.userId, amount);
    res.json({ balance: user.walletBalance });
}

export async function withdrawFunds(req, res) {
    const { amount } = z.object({ amount: z.number().int().min(10).max(MAX_TOPUP) }).parse(req.body);
    const user = await withdraw(req.user.userId, amount);
    res.json({ balance: user.walletBalance });
}
