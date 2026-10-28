# GigMate

A safe, beginner-friendly freelancing platform for students: campus-verified users, small beginner-priced tasks, escrow-protected payments and in-app chat that blocks off-platform contact.

**Stack:** React 19 + Vite + Tailwind (frontend), Node + Express + MongoDB/Mongoose (backend), JWT auth.

## Run it

```bash
# 1. backend
cd backend
cp .env.example .env        # set JWT_SECRET, ADMIN_PASSWORD; MongoDB defaults to localhost
npm install
npm run seed:admin          # creates the admin account from .env
npm run dev                 # API on :3001

# 2. frontend (new terminal)
cd frontend
npm install
npm run dev                 # app on :5000, proxies /api to :3001
```

Run the API tests (uses an in-memory MongoDB, no setup needed): `cd backend && npm test`

## How the problem statement is covered

| Problem | Feature | Where |
|---|---|---|
| Beginners lose to experts | "New Talent" badge + filter, micro-task budgets (₹50-₹20,000), trust score that starts at 45 for verified students | `utils/trust.js`, Gigs page |
| No portfolio / reviews | Student profile (projects, portfolio links), reviews after each order | `Review` model, profile page |
| No student-level marketplace | Task board with campus (college) filter; gigs and tasks | `Task`, `Proposal`, Tasks page |
| Fake clients | Email OTP + ID proof, admin approval before posting, applying or paying | `verification.controller.js`, Admin panel |
| Phishing / bank-detail requests | Filter blocks links, phone numbers, UPI IDs, emails and "pay outside" phrases in tasks, proposals, gigs and chat; chat messages are masked, flagged and counted as strikes | `utils/fraudFilter.js` |
| No secure payment | Simulated wallet + escrow: money is held when you hire, released only when the client approves (auto-release after 7 days if the client is silent) | `services/escrow.js` |
| Disputes | Either side can open a dispute; admin releases or refunds. Users can also be reported | `Report` model, Admin panel |

## Flow

1. Student and client sign up, verify (OTP -> ID proof -> admin approves).
2. Client tops up the wallet and posts a task (or buys a gig).
3. Students send proposals; client hires one -> amount moves into escrow.
4. Student delivers -> client approves (or requests up to 2 revisions, or disputes).
5. Approval releases payment, then both sides review each other. Trust scores update.

## Important notes

- **Payments are simulated.** The wallet is a balance field and a ledger (`Transaction`). `routes/wallet.routes.js` top-up is the place to plug in Razorpay (test mode): create an order, verify the signature, then call `topUp()`.
- **Emails are not sent.** The OTP is printed in the server console and, outside production, returned as `devOtp` so you can demo it.
- **ID proof is a link** (e.g. a Drive/Imgur URL) reviewed by the admin. Swap in Cloudinary uploads if you want file upload.
- Chat uses polling (every 5 s) instead of WebSockets to keep the project simple.
- Env: `MONGO_URL` (or `MONGODB_URI`), `JWT_SECRET`, `AUTO_RELEASE_DAYS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## API overview

`/api/auth` · `/api/users` · `/api/gigs` · `/api/tasks` · `/api/proposals` · `/api/orders` (accept, decline, deliver, approve, revision, dispute, messages, review) · `/api/wallet` · `/api/verification` · `/api/reports` · `/api/admin`
