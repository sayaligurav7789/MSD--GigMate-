import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
const signupSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().toLowerCase(),
    password: z.string().min(6).max(128),
    role: z.enum(["student", "client"]),
});
const loginSchema = z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
});
export async function signup(req, res, next) {
    try {
        const data = signupSchema.parse(req.body);
        const existing = await User.findOne({ email: data.email });
        if (existing) {
            return res.status(409).json({ message: "Email already registered" });
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await User.create({
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
            isProfileComplete: false,
        });
        // No auto-login: user must sign in after account creation.
        res.status(201).json({
            message: "Account created. Please sign in.",
            user,
        });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}
export async function login(req, res, next) {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ message: "Invalid credentials" });
        if (user.isBanned)
            return res.status(403).json({ message: "This account has been suspended" });
        const token = signToken({ userId: user.id, role: user.role });
        res.json({ token, user });
    }
    catch (err) {
        if (err?.name === "ZodError") {
            return res.status(400).json({ message: "Validation error", errors: err.errors });
        }
        next(err);
    }
}
export async function me(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json({ user });
    }
    catch (err) {
        next(err);
    }
}
