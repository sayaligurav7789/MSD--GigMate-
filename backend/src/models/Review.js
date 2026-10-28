import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema({
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    reviewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500, default: "" },
}, { timestamps: true });

ReviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });

export const Review = mongoose.model("Review", ReviewSchema);
