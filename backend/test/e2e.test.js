// End-to-end API test: runs the real Express app against an in-memory MongoDB.
//   npm install && npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

let mongod, server, base, User;

async function call(method, path, body, token) {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
}

before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    const { connectDB } = await import("../src/config/db.js");
    await connectDB();
    ({ User } = await import("../src/models/User.js"));
    const { default: app } = await import("../src/app.js");
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
    server?.close();
    await mongoose.disconnect();
    await mongod?.stop();
});

async function register(name, email, role) {
    const s = await call("POST", "/auth/signup", { name, email, password: "secret123", role });
    assert.equal(s.status, 201, JSON.stringify(s.body));
    const l = await call("POST", "/auth/login", { email, password: "secret123" });
    assert.equal(l.status, 200);
    return { id: l.body.user._id, token: l.body.token };
}

async function verify(u, email, admin) {
    const o = await call("POST", "/verification/send-otp", { email }, u.token);
    assert.equal(o.status, 200, JSON.stringify(o.body));
    const v = await call("POST", "/verification/verify-otp", { otp: o.body.devOtp }, u.token);
    assert.equal(v.status, 200, JSON.stringify(v.body));
    const id = await call("POST", "/verification/submit-id", { idProofUrl: "https://example.com/id.jpg" }, u.token);
    assert.equal(id.status, 200, JSON.stringify(id.body));
    const a = await call("POST", `/admin/users/${u.id}/verification`, { approve: true }, admin.token);
    assert.equal(a.status, 200, JSON.stringify(a.body));
}

test("full marketplace flow: verify -> task -> escrow -> chat filter -> deliver -> approve -> review", async () => {
    await User.create({ name: "Admin", email: "admin@test.local", passwordHash: await bcrypt.hash("secret123", 10), role: "admin", isProfileComplete: true });
    const adminLogin = await call("POST", "/auth/login", { email: "admin@test.local", password: "secret123" });
    const admin = { token: adminLogin.body.token };

    const student = await register("Stu Dent", "stu@college.ac.in", "student");
    const client = await register("Cli Ent", "client@gmail.com", "client");

    // Unverified users are blocked from marketplace actions.
    const blocked = await call("POST", "/tasks", {}, client.token);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.code, "NOT_VERIFIED");

    // Students need an academic email.
    const bad = await call("POST", "/verification/send-otp", { email: "stu@gmail.com" }, student.token);
    assert.equal(bad.status, 400);

    await verify(student, "stu@college.ac.in", admin);
    await verify(client, "client@gmail.com", admin);

    // Non-admins cannot reach the admin API.
    assert.equal((await call("GET", "/admin/stats", null, client.token)).status, 403);

    assert.equal((await call("POST", "/wallet/topup", { amount: 1000 }, client.token)).status, 200);

    // Fraud filter on task text.
    const deadline = new Date(Date.now() + 7 * 864e5).toISOString();
    const phish = await call("POST", "/tasks", {
        title: "Poster design", description: "Contact me on whatsapp or visit https://evil.example.com for details",
        category: "Graphic Design", budget: 500, deadline,
    }, client.token);
    assert.equal(phish.status, 400);

    const t = await call("POST", "/tasks", {
        title: "Poster for college fest", description: "Need an A3 poster for our college fest, bright colours please.",
        category: "Graphic Design", budget: 500, deadline, college: "Test College",
    }, client.token);
    assert.equal(t.status, 201, JSON.stringify(t.body));
    const taskId = t.body.task._id;

    // Proposal with a phone number is rejected; a clean one is accepted.
    const pBad = await call("POST", `/tasks/${taskId}/proposals`, { price: 400, deliveryDays: 3, message: "Call me on 9876543210 to discuss" }, student.token);
    assert.equal(pBad.status, 400);
    const p = await call("POST", `/tasks/${taskId}/proposals`, { price: 400, deliveryDays: 3, message: "I have designed posters for three clubs before." }, student.token);
    assert.equal(p.status, 201, JSON.stringify(p.body));
    assert.equal((await call("POST", `/tasks/${taskId}/proposals`, { price: 400, deliveryDays: 3, message: "Sending a second proposal again" }, student.token)).status, 409);

    // Hiring puts money into escrow.
    const hire = await call("POST", `/proposals/${p.body.proposal._id}/accept`, null, client.token);
    assert.equal(hire.status, 201, JSON.stringify(hire.body));
    const orderId = hire.body.order._id;
    assert.equal(hire.body.order.escrow.status, "held");
    assert.equal((await call("GET", "/wallet", null, client.token)).body.balance, 600);

    // Chat filter masks contact details and records a strike.
    const msg = await call("POST", `/orders/${orderId}/messages`, { text: "call me on 9876543210 and pay on gpay" }, student.token);
    assert.equal(msg.status, 201);
    assert.equal(msg.body.message.flagged, true);
    assert.ok(msg.body.warning);
    assert.ok(!msg.body.message.text.includes("9876543210"));
    const flagged = await call("GET", "/admin/flagged-messages", null, admin.token);
    assert.equal(flagged.body.messages.length, 1);

    // Only the client can approve, and only after delivery.
    assert.equal((await call("POST", `/orders/${orderId}/approve`, null, client.token)).status, 400);
    const del = await call("POST", `/orders/${orderId}/deliver`, { note: "Final files attached", link: "https://drive.example.com/file" }, student.token);
    assert.equal(del.status, 200, JSON.stringify(del.body));
    assert.equal((await call("POST", `/orders/${orderId}/approve`, null, student.token)).status, 403);
    const done = await call("POST", `/orders/${orderId}/approve`, null, client.token);
    assert.equal(done.status, 200, JSON.stringify(done.body));
    assert.equal(done.body.order.status, "completed");
    assert.equal(done.body.order.escrow.status, "released");
    assert.equal((await call("GET", "/wallet", null, student.token)).body.balance, 400);

    // Approving twice cannot pay twice.
    assert.equal((await call("POST", `/orders/${orderId}/approve`, null, client.token)).status, 400);

    // Reviews update reputation.
    assert.equal((await call("POST", `/orders/${orderId}/review`, { rating: 5, comment: "Great work" }, client.token)).status, 201);
    assert.equal((await call("POST", `/orders/${orderId}/review`, { rating: 5 }, client.token)).status, 409);
    const profile = await call("GET", `/users/${student.id}`);
    assert.equal(profile.body.user.stats.ratingCount, 1);
    assert.equal(profile.body.user.stats.completedOrders, 1);
    assert.ok(profile.body.user.trustScore > 45);
    assert.equal(profile.body.user.walletBalance, undefined); // private fields are not exposed
    assert.equal(profile.body.user.email, undefined);
});

test("insufficient funds and dispute -> admin refund", async () => {
    const adminLogin = await call("POST", "/auth/login", { email: "admin@test.local", password: "secret123" });
    const admin = { token: adminLogin.body.token };
    const student = (await call("POST", "/auth/login", { email: "stu@college.ac.in", password: "secret123" })).body;
    const client = (await call("POST", "/auth/login", { email: "client@gmail.com", password: "secret123" })).body;

    const cheap = await call("POST", "/gigs", { title: "Logo design", description: "A clean modern logo for your club", category: "Graphic Design", price: 300, deliveryDays: 2, skills: ["logo"] }, student.token);
    const pricey = await call("POST", "/gigs", { title: "Full website", description: "A complete website for your event", category: "Web Development", price: 5000, deliveryDays: 10, skills: [] }, student.token);
    assert.equal(cheap.status, 201, JSON.stringify(cheap.body));

    const poor = await call("POST", "/orders", { gigId: pricey.body.gig._id, requirements: "Need it fast" }, client.token);
    assert.equal(poor.status, 402);

    const before = (await call("GET", "/wallet", null, client.token)).body.balance;
    const o = await call("POST", "/orders", { gigId: cheap.body.gig._id, requirements: "Blue and white theme" }, client.token);
    assert.equal(o.status, 201, JSON.stringify(o.body));
    const orderId = o.body.order._id;
    assert.equal((await call("GET", "/wallet", null, client.token)).body.balance, before - 300);

    assert.equal((await call("POST", `/orders/${orderId}/accept`, null, student.token)).status, 200);
    const d = await call("POST", `/orders/${orderId}/dispute`, { reason: "Freelancer unresponsive", details: "No updates for days" }, client.token);
    assert.equal(d.status, 201, JSON.stringify(d.body));

    const reports = await call("GET", "/admin/reports", null, admin.token);
    const report = reports.body.reports.find((r) => r.type === "dispute");
    assert.ok(report);
    const res = await call("POST", `/admin/reports/${report._id}/resolve`, { decision: "refund", note: "Refunded" }, admin.token);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal((await call("GET", "/wallet", null, client.token)).body.balance, before);
    assert.equal((await call("GET", `/orders/${orderId}`, null, client.token)).body.order.status, "cancelled");
});
