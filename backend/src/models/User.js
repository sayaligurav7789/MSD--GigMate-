import mongoose, { Schema } from "mongoose";

const StudentProfileSchema = new Schema({
    college: { type: String, trim: true },
    degree: { type: String, trim: true },
    year: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    skills: [{ type: String, trim: true }],
    portfolioLinks: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
}, { _id: false });

const ClientProfileSchema = new Schema({
    companyName: { type: String, trim: true },
    description: { type: String, maxlength: 500 },
    industry: { type: String, trim: true },
    college: { type: String, trim: true }, // set for campus clubs / student clients
}, { _id: false });

// Identity verification: email OTP + ID proof reviewed by an admin.
const VerificationSchema = new Schema({
    collegeEmail: { type: String, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    otpHash: { type: String },
    otpExpires: { type: Date },
    otpAttempts: { type: Number, default: 0 },
    idProofUrl: { type: String, trim: true },
    idNote: { type: String, maxlength: 300 },
    status: { type: String, enum: ["none", "pending", "verified", "rejected"], default: "none" },
    rejectionReason: { type: String },
    reviewedAt: { type: Date },
}, { _id: false });

const StatsSchema = new Schema({
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    onTimeOrders: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
    fraudStrikes: { type: Number, default: 0 },
}, { _id: false });

const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "client", "admin"], required: true },
    isProfileComplete: { type: Boolean, default: false },
    studentProfile: { type: StudentProfileSchema, default: undefined },
    clientProfile: { type: ClientProfileSchema, default: undefined },
    verification: { type: VerificationSchema, default: () => ({}) },
    stats: { type: StatsSchema, default: () => ({}) },
    trustScore: { type: Number, default: 10 },
    // Simulated wallet (stand-in for a payment gateway in test mode).
    walletBalance: { type: Number, default: 0, min: 0 },
    isBanned: { type: Boolean, default: false },
}, { timestamps: true });

UserSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    delete obj.__v;
    if (obj.verification) {
        delete obj.verification.otpHash;
        delete obj.verification.otpExpires;
        delete obj.verification.otpAttempts;
    }
    return obj;
};

export const User = mongoose.model("User", UserSchema);

// Safe public fields for embedding in other documents.
export const PUBLIC_USER_FIELDS = "name role studentProfile clientProfile stats trustScore verification.status";
