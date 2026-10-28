import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1000 }, // already masked if flagged
    flagged: { type: Boolean, default: false, index: true },
    flagReasons: [String],
    originalText: { type: String, select: false }, // kept for admin review only
}, { timestamps: true });

export const Message = mongoose.model("Message", MessageSchema);
