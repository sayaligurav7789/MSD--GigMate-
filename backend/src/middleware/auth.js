import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// Verifies the JWT and loads the current user (so bans and verification take effect immediately).
export async function authRequired(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET not set");
        const payload = jwt.verify(header.slice(7), secret);
        const user = await User.findById(payload.userId);
        if (!user) return res.status(401).json({ message: "Account not found" });
        if (user.isBanned) return res.status(403).json({ message: "This account has been suspended" });
        req.user = { userId: user.id, role: user.role, verified: user.verification?.status === "verified" };
        req.userDoc = user;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }
        next();
    };
}

// Blocks money / marketplace actions until an admin has approved the user's identity.
export function requireVerified(req, res, next) {
    if (!req.user?.verified) {
        return res.status(403).json({
            message: "Verify your account first (email OTP + ID proof, approved by admin).",
            code: "NOT_VERIFIED",
        });
    }
    next();
}
