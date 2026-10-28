import mongoose, { Schema } from "mongoose";

const ProposalSchema = new Schema({
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    price: { type: Number, required: true, min: 50 },
    deliveryDays: { type: Number, required: true, min: 1, max: 365 },
    message: { type: String, required: true, maxlength: 1000 },
    status: { type: String, enum: ["pending", "accepted", "rejected", "withdrawn"], default: "pending" },
}, { timestamps: true });

// A student can send only one proposal per task.
ProposalSchema.index({ task: 1, student: 1 }, { unique: true });

export const Proposal = mongoose.model("Proposal", ProposalSchema);
