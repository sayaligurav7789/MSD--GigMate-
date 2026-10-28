import mongoose, { Schema } from "mongoose";

// Covers both order disputes (type "dispute") and user reports (type "report").
const ReportSchema = new Schema({
    type: { type: String, enum: ["dispute", "report"], required: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    target: { type: Schema.Types.ObjectId, ref: "User" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    reason: { type: String, required: true, maxlength: 80 },
    details: { type: String, maxlength: 1000, default: "" },
    status: { type: String, enum: ["open", "resolved"], default: "open", index: true },
    resolution: {
        decision: { type: String, enum: ["release", "refund", "dismiss", "warn", "ban"] },
        note: String,
        resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
        resolvedAt: Date,
    },
}, { timestamps: true });

export const Report = mongoose.model("Report", ReportSchema);
