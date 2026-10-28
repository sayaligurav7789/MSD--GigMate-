import crypto from "node:crypto";
import { z } from "zod";
import { User } from "../models/User.js";
import { HttpError, assert } from "../utils/http.js";
import { COLLEGE_EMAIL_RE } from "../constants.js";
import { recomputeTrust } from "../services/escrow.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hash = (otp) => crypto.createHash("sha256").update(`${otp}:${process.env.JWT_SECRET}`).digest("hex");

export async function status(req, res) {
    res.json({ verification: req.userDoc.toJSON().verification });
}

// Step 1: send a 6-digit code to the college email (students) or login email (clients).
// There is no mail server in this project, so the code is printed to the server console and,
// outside production, returned in the response as `devOtp`.
export async function sendOtp(req, res) {
    const user = req.userDoc;
    const { email } = z.object({ email: z.string().email().toLowerCase() }).parse(req.body);
    if (user.role === "student") {
        assert(COLLEGE_EMAIL_RE.test(email), 400, "Students must use a college email (ending in .edu, .ac.in, .edu.in, ...)");
    }
    const otp = String(crypto.randomInt(100000, 1000000));
    user.verification.collegeEmail = email;
    user.verification.emailVerified = false;
    user.verification.otpHash = hash(otp);
    user.verification.otpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.verification.otpAttempts = 0;
    await user.save();
    console.log(`[OTP] ${email}: ${otp}`);
    const body = { message: `OTP sent to ${email}. It expires in 10 minutes.` };
    if (process.env.NODE_ENV !== "production") body.devOtp = otp;
    res.json(body);
}

// Step 2: confirm the code.
export async function confirmOtp(req, res) {
    const user = req.userDoc;
    const { otp } = z.object({ otp: z.string().regex(/^\d{6}$/) }).parse(req.body);
    const v = user.verification;
    assert(v.otpHash && v.otpExpires, 400, "Request an OTP first");
    assert(v.otpExpires.getTime() > Date.now(), 400, "OTP expired. Request a new one.");
    assert(v.otpAttempts < MAX_ATTEMPTS, 429, "Too many wrong attempts. Request a new OTP.");
    if (hash(otp) !== v.otpHash) {
        v.otpAttempts += 1;
        await user.save();
        throw new HttpError(400, "Incorrect OTP");
    }
    v.emailVerified = true;
    v.otpHash = undefined;
    v.otpExpires = undefined;
    v.otpAttempts = 0;
    await user.save();
    await recomputeTrust(user._id);
    res.json({ message: "Email verified", verification: user.toJSON().verification });
}

// Step 3: submit ID proof (a link to the uploaded student ID / business proof) for admin review.
export async function submitId(req, res) {
    const user = req.userDoc;
    const { idProofUrl, idNote } = z.object({
        idProofUrl: z.string().url().max(500),
        idNote: z.string().max(300).optional().default(""),
    }).parse(req.body);
    assert(user.verification.emailVerified, 400, "Verify your email with the OTP first");
    assert(user.verification.status !== "verified", 400, "You are already verified");
    user.verification.idProofUrl = idProofUrl;
    user.verification.idNote = idNote;
    user.verification.status = "pending";
    user.verification.rejectionReason = undefined;
    await user.save();
    res.json({ message: "Submitted. An admin will review your ID shortly.", verification: user.toJSON().verification });
}
