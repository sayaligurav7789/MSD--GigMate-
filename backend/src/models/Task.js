import mongoose, { Schema } from "mongoose";

// A request posted by a client ("I need a poster for our fest"). Students send proposals.
const TaskSchema = new Schema({
    client: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, index: true },
    budget: { type: Number, required: true, min: 50, max: 20000 },
    deadline: { type: Date, required: true },
    skills: [{ type: String, trim: true }],
    college: { type: String, trim: true, index: true },
    status: { type: String, enum: ["open", "assigned", "completed", "cancelled"], default: "open", index: true },
    hiredStudent: { type: Schema.Types.ObjectId, ref: "User" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    proposalCount: { type: Number, default: 0 },
}, { timestamps: true });

TaskSchema.index({ title: "text", description: "text", category: "text", skills: "text" });

export const Task = mongoose.model("Task", TaskSchema);
