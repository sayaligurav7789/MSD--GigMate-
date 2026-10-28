import { z } from "zod";
import { Task } from "../models/Task.js";
import { Proposal } from "../models/Proposal.js";
import { Order } from "../models/Order.js";
import { PUBLIC_USER_FIELDS } from "../models/User.js";
import { HttpError, assert } from "../utils/http.js";
import { scanText } from "../utils/fraudFilter.js";
import { holdFunds, returnHold } from "../services/escrow.js";

const DAY = 24 * 60 * 60 * 1000;

function rejectIfUnsafe(...texts) {
    const reasons = [...new Set(texts.flatMap((t) => scanText(t).reasons))];
    if (reasons.length) {
        throw new HttpError(400, "Links, contact details and payment info are not allowed here. Use the in-app chat after you are matched.", { reasons });
    }
}

const taskSchema = z.object({
    title: z.string().min(5).max(120),
    description: z.string().min(20).max(2000),
    category: z.string().min(2).max(60),
    budget: z.number().min(50).max(20000),
    deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Deadline must be in the future"),
    skills: z.array(z.string().max(40)).max(10).default([]),
    college: z.string().max(120).optional().default(""),
});

const proposalSchema = z.object({
    price: z.number().min(50).max(20000),
    deliveryDays: z.number().int().min(1).max(365),
    message: z.string().min(10).max(1000),
});

// ---- tasks -----------------------------------------------------------------------------

export async function listTasks(req, res) {
    const { q, category, college, minBudget, maxBudget } = req.query;
    const filter = { status: "open" };
    if (category) filter.category = category;
    if (college) filter.college = new RegExp(`^${String(college).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    if (minBudget || maxBudget) {
        filter.budget = {};
        if (minBudget) filter.budget.$gte = Number(minBudget);
        if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    if (q) filter.$text = { $search: String(q) };
    const tasks = await Task.find(filter)
        .populate("client", `name ${PUBLIC_USER_FIELDS}`)
        .sort({ createdAt: -1 })
        .limit(100);
    res.json({ tasks });
}

export async function myTasks(req, res) {
    const tasks = await Task.find({ client: req.user.userId }).sort({ createdAt: -1 });
    res.json({ tasks });
}

export async function createTask(req, res) {
    const data = taskSchema.parse(req.body);
    rejectIfUnsafe(data.title, data.description);
    const college = data.college || req.userDoc.clientProfile?.college || "";
    const task = await Task.create({ ...data, college, client: req.user.userId });
    res.status(201).json({ task });
}

export async function getTask(req, res) {
    const task = await Task.findById(req.params.id).populate("client", `name ${PUBLIC_USER_FIELDS}`);
    assert(task, 404, "Task not found");
    const out = { task };
    // Clients see every proposal on their own task; students only see their own.
    if (req.user) {
        const isOwner = task.client._id.toString() === req.user.userId;
        if (isOwner) {
            out.proposals = await Proposal.find({ task: task._id, status: { $ne: "withdrawn" } })
                .populate("student", `name ${PUBLIC_USER_FIELDS}`)
                .sort({ createdAt: 1 });
        } else if (req.user.role === "student") {
            out.myProposal = await Proposal.findOne({ task: task._id, student: req.user.userId });
        }
    }
    res.json(out);
}

export async function cancelTask(req, res) {
    const task = await Task.findById(req.params.id);
    assert(task, 404, "Task not found");
    assert(task.client.toString() === req.user.userId, 403, "Not your task");
    assert(task.status === "open", 400, "Only open tasks can be cancelled");
    task.status = "cancelled";
    await task.save();
    await Proposal.updateMany({ task: task._id, status: "pending" }, { $set: { status: "rejected" } });
    res.json({ task });
}

// ---- proposals -------------------------------------------------------------------------

export async function createProposal(req, res) {
    const task = await Task.findById(req.params.id);
    assert(task, 404, "Task not found");
    assert(task.status === "open", 400, "This task is no longer open");
    const data = proposalSchema.parse(req.body);
    rejectIfUnsafe(data.message);
    try {
        const proposal = await Proposal.create({ ...data, task: task._id, student: req.user.userId });
        await Task.updateOne({ _id: task._id }, { $inc: { proposalCount: 1 } });
        res.status(201).json({ proposal });
    } catch (err) {
        if (err?.code === 11000) throw new HttpError(409, "You already sent a proposal for this task");
        throw err;
    }
}

export async function myProposals(req, res) {
    const proposals = await Proposal.find({ student: req.user.userId })
        .populate("task", "title budget status deadline")
        .sort({ createdAt: -1 });
    res.json({ proposals });
}

export async function withdrawProposal(req, res) {
    const proposal = await Proposal.findById(req.params.id);
    assert(proposal, 404, "Proposal not found");
    assert(proposal.student.toString() === req.user.userId, 403, "Not your proposal");
    assert(proposal.status === "pending", 400, "Only pending proposals can be withdrawn");
    proposal.status = "withdrawn";
    await proposal.save();
    await Task.updateOne({ _id: proposal.task }, { $inc: { proposalCount: -1 } });
    res.json({ proposal });
}

export async function rejectProposal(req, res) {
    const proposal = await Proposal.findById(req.params.id).populate("task");
    assert(proposal, 404, "Proposal not found");
    assert(proposal.task.client.toString() === req.user.userId, 403, "Not your task");
    assert(proposal.status === "pending", 400, "Proposal is not pending");
    proposal.status = "rejected";
    await proposal.save();
    res.json({ proposal });
}

// Accepting a proposal = hiring: money moves into escrow and an order starts immediately.
export async function acceptProposal(req, res) {
    const proposal = await Proposal.findById(req.params.id).populate("task");
    assert(proposal, 404, "Proposal not found");
    const task = proposal.task;
    assert(task.client.toString() === req.user.userId, 403, "Not your task");
    assert(proposal.status === "pending", 400, "Proposal is not pending");

    // Claim the task atomically so two clicks cannot hire twice.
    const claimed = await Task.findOneAndUpdate(
        { _id: task._id, status: "open" },
        { $set: { status: "assigned", hiredStudent: proposal.student } },
        { new: true },
    );
    assert(claimed, 409, "This task was already assigned");

    try {
        await holdFunds(req.user.userId, proposal.price, `Escrow for "${task.title}"`);
    } catch (err) {
        await Task.updateOne({ _id: task._id }, { $set: { status: "open" }, $unset: { hiredStudent: 1 } });
        throw err;
    }
    try {
        const order = await Order.create({
            task: task._id,
            title: task.title,
            client: task.client,
            student: proposal.student,
            price: proposal.price,
            requirements: task.description.slice(0, 1000),
            deadline: new Date(Math.min(task.deadline.getTime(), Date.now() + proposal.deliveryDays * DAY)),
            status: "in-progress",
            escrow: { status: "held", amount: proposal.price },
        });
        claimed.order = order._id;
        await claimed.save();
        proposal.status = "accepted";
        await proposal.save();
        await Proposal.updateMany({ task: task._id, _id: { $ne: proposal._id }, status: "pending" }, { $set: { status: "rejected" } });
        res.status(201).json({ order });
    } catch (err) {
        await returnHold(req.user.userId, proposal.price, "Refund: order could not be created");
        await Task.updateOne({ _id: task._id }, { $set: { status: "open" }, $unset: { hiredStudent: 1 } });
        throw err;
    }
}
