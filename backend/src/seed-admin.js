// Creates (or resets) the admin account: npm run seed:admin
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";

const email = (process.env.ADMIN_EMAIL || "admin@gigmate.local").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 8) {
    console.error("Set ADMIN_PASSWORD (min 8 chars) in backend/.env first.");
    process.exit(1);
}
await connectDB();
const passwordHash = await bcrypt.hash(password, 10);
await User.findOneAndUpdate(
    { email },
    { $set: { name: "GigMate Admin", email, passwordHash, role: "admin", isProfileComplete: true, "verification.status": "verified" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
);
console.log(`Admin ready: ${email}`);
await mongoose.disconnect();
