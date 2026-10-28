import { z } from "zod";
import { User, PUBLIC_USER_FIELDS } from "../models/User.js";
import { Review } from "../models/Review.js";
const studentProfileSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    college: z.string().max(120).optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).optional(),
    portfolioLinks: z.array(z.string()).optional(),
});
const clientProfileSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    companyName: z.string().max(120).optional(),
    description: z.string().max(500).optional(),
    industry: z.string().max(80).optional(),
});
const studentSetupSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    college: z.string().min(1).max(120),
    degree: z.string().max(120).optional().default(""),
    year: z.string().max(40).optional().default(""),
    skills: z.array(z.string().min(1)).min(1),
    portfolioLinks: z.array(z.string()).optional().default([]),
    projects: z.array(z.string()).optional().default([]),
    bio: z.string().max(500).optional().default(""),
});
const clientSetupSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    companyName: z.string().min(1).max(120),
    description: z.string().min(1).max(500),
    industry: z.string().max(80).optional().default(""),
});
export async function getUserById(req, res, next) {
    try {
        const user = await User.findById(req.params.id).select(PUBLIC_USER_FIELDS);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json({ user });
    }
    catch (err) {
        next(err);
    }
}
export async function updateMyProfile(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.role === "student") {
            const data = studentProfileSchema.parse(req.body);
            if (data.name !== undefined)
                user.name = data.name;
            const sp = user.studentProfile ?? { skills: [], portfolioLinks: [], projects: [] };
            if (data.college !== undefined)
                sp.college = data.college;
            if (data.bio !== undefined)
                sp.bio = data.bio;
            if (data.skills !== undefined)
                sp.skills = data.skills;
            if (data.portfolioLinks !== undefined)
                sp.portfolioLinks = data.portfolioLinks;
            user.studentProfile = sp;
        }
        else {
            const data = clientProfileSchema.parse(req.body);
            if (data.name !== undefined)
                user.name = data.name;
            const cp = user.clientProfile ?? {};
            if (data.companyName !== undefined)
                cp.companyName = data.companyName;
            if (data.description !== undefined)
                cp.description = data.description;
            if (data.industry !== undefined)
                cp.industry = data.industry;
            user.clientProfile = cp;
        }
        await user.save();
        res.json({ user });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}
export async function setupStudentProfile(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.role !== "student") {
            return res.status(403).json({ message: "Only student accounts can complete the student profile" });
        }
        const data = studentSetupSchema.parse(req.body);
        if (data.name)
            user.name = data.name;
        user.studentProfile = {
            college: data.college,
            degree: data.degree ?? "",
            year: data.year ?? "",
            bio: data.bio ?? "",
            skills: data.skills,
            portfolioLinks: data.portfolioLinks ?? [],
            projects: data.projects ?? [],
        };
        user.isProfileComplete = true;
        await user.save();
        res.json({ user });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}
export async function setupClientProfile(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.role !== "client") {
            return res.status(403).json({ message: "Only client accounts can complete the client profile" });
        }
        const data = clientSetupSchema.parse(req.body);
        if (data.name)
            user.name = data.name;
        user.clientProfile = {
            companyName: data.companyName,
            description: data.description,
            industry: data.industry ?? "",
        };
        user.isProfileComplete = true;
        await user.save();
        res.json({ user });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}

export async function getUserReviews(req, res, next) {
    try {
        const reviews = await Review.find({ reviewee: req.params.id })
            .populate("reviewer", "name role")
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ reviews });
    }
    catch (err) {
        next(err);
    }
}
