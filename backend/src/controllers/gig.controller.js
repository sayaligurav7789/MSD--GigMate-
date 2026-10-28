import { z } from "zod";
import { Gig } from "../models/Gig.js";
import { User, PUBLIC_USER_FIELDS } from "../models/User.js";
import { NEW_TALENT_MAX_ORDERS } from "../utils/trust.js";
import { scanText } from "../utils/fraudFilter.js";
import { HttpError } from "../utils/http.js";
const gigSchema = z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(2000),
    category: z.string().min(2).max(60),
    price: z.number().nonnegative(),
    deliveryDays: z.number().int().min(1).max(365),
    skills: z.array(z.string()).default([]),
});
const gigUpdateSchema = gigSchema.partial().extend({
    isActive: z.boolean().optional(),
});
export async function listGigs(req, res, next) {
    try {
        const { q, category, minPrice, maxPrice, student, newTalent, college } = req.query;
        const filter = { isActive: true };
        if (category)
            filter.category = category;
        if (student)
            filter.student = student;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice)
                filter.price.$gte = Number(minPrice);
            if (maxPrice)
                filter.price.$lte = Number(maxPrice);
        }
        if (q)
            filter.$text = { $search: q };
        // Beginner-friendly filters: only students with few completed orders / from one college.
        if (newTalent === "1" || college) {
            const uf = { role: "student", isBanned: { $ne: true } };
            if (newTalent === "1")
                uf["stats.completedOrders"] = { $lt: NEW_TALENT_MAX_ORDERS };
            if (college)
                uf["studentProfile.college"] = new RegExp(`^${String(college).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
            const ids = await User.find(uf).distinct("_id");
            filter.student = { $in: ids };
        }
        const gigs = await Gig.find(filter)
            .populate("student", PUBLIC_USER_FIELDS)
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ gigs });
    }
    catch (err) {
        next(err);
    }
}
export async function getGig(req, res, next) {
    try {
        const gig = await Gig.findById(req.params.id).populate("student", PUBLIC_USER_FIELDS);
        if (!gig)
            return res.status(404).json({ message: "Gig not found" });
        res.json({ gig });
    }
    catch (err) {
        next(err);
    }
}
export async function getMyGigs(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const gigs = await Gig.find({ student: req.user.userId }).sort({ createdAt: -1 });
        res.json({ gigs });
    }
    catch (err) {
        next(err);
    }
}
export async function createGig(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const data = gigSchema.parse(req.body);
        const scan = scanText(`${data.title} ${data.description}`);
        if (scan.flagged)
            throw new HttpError(400, "Links, contact details and payment info are not allowed in gig listings.", { reasons: scan.reasons });
        const gig = await Gig.create({ ...data, student: req.user.userId });
        res.status(201).json({ gig });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}
export async function updateGig(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const gig = await Gig.findById(req.params.id);
        if (!gig)
            return res.status(404).json({ message: "Gig not found" });
        if (gig.student.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Not your gig" });
        }
        const data = gigUpdateSchema.parse(req.body);
        Object.assign(gig, data);
        await gig.save();
        res.json({ gig });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}
export async function deleteGig(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const gig = await Gig.findById(req.params.id);
        if (!gig)
            return res.status(404).json({ message: "Gig not found" });
        if (gig.student.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Not your gig" });
        }
        await gig.deleteOne();
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
}
