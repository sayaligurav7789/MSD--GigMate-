import mongoose, { Schema } from "mongoose";

// Wallet ledger: every balance change leaves a row here.
const TransactionSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["topup", "escrow_hold", "escrow_release", "refund", "withdraw"], required: true },
    amount: { type: Number, required: true }, // positive = credit, negative = debit
    balanceAfter: { type: Number },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    note: String,
}, { timestamps: true });

export const Transaction = mongoose.model("Transaction", TransactionSchema);
