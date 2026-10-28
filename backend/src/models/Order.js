import mongoose, { Schema } from "mongoose";
import { ORDER_STATUSES } from "../constants.js";

// An order is created either from a Gig (client buys) or from a Task (client accepts a proposal).
const OrderSchema = new Schema({
    gig: { type: Schema.Types.ObjectId, ref: "Gig", index: true },
    task: { type: Schema.Types.ObjectId, ref: "Task", index: true },
    title: { type: String, required: true },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    requirements: { type: String, maxlength: 1000 },
    deadline: { type: Date },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    // Escrow: money is taken from the client's wallet when the order is created and
    // released to the student only after the client approves the work.
    escrow: {
        status: { type: String, enum: ["held", "released", "refunded"], default: "held" },
        amount: { type: Number, required: true },
    },
    delivery: {
        note: String,
        link: String,
        deliveredAt: Date,
    },
    revisions: { type: Number, default: 0 },
    completedAt: Date,
}, { timestamps: true });

export const Order = mongoose.model("Order", OrderSchema);
