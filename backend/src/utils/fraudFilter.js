// Detects contact details, links, payment requests and phishing phrases.
// Used to keep conversations and listings inside the platform.
const RULES = [
    { reason: "link", re: /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|in|io|co|me|xyz|ly|app|dev|link|info|biz|site|online|shop|top|club)\b(\/\S*)?/i },
    { reason: "email", re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i },
    { reason: "upi-id", re: /\b[a-z0-9._-]{2,}@(ok(sbi|hdfcbank|icici|axis)|ybl|ibl|axl|paytm|upi|apl|oksbi|sbi|hdfcbank|icici|pnb|fbl|jupiter|slice)\b/i },
    { reason: "phone-number", test: (t) => /(\+?\d[\d\s().-]{8,}\d)/.test(t) && (t.match(/\d/g) || []).length >= 10 },
    { reason: "bank-details", re: /\b(account\s*(no|number|num)|a\/c|ifsc|swift\s*code|iban|routing\s*number|card\s*number|cvv|debit\s*card|credit\s*card)\b/i },
    { reason: "off-platform-payment", re: /\b(pay\s*(me\s*)?(outside|directly|offline|on\s*(gpay|phonepe|paytm))|outside\s*(the\s*)?(platform|app|gigmate)|direct\s*payment|advance\s*payment|western\s*union|send\s*(me\s*)?money|gpay|google\s*pay|phonepe|paytm|bhim|upi|paypal|bitcoin|crypto|gift\s*card)\b/i },
    { reason: "off-platform-contact", re: /\b(whats\s*app|whatsapp|telegram|signal|instagram|insta\s*dm|snapchat|skype|discord|text\s*me|call\s*me|dm\s*me|contact\s*me\s*on)\b/i },
    { reason: "credentials-request", re: /\b((share|send|give|tell|enter)\s+(me\s+)?(your\s+)?(otp|password|pin|cvv|card|net\s*banking|login\s*details)|verify\s*your\s*(account|bank))\b/i },
];

export function scanText(text = "") {
    const reasons = [];
    for (const rule of RULES) {
        const hit = rule.test ? rule.test(text) : rule.re.test(text);
        if (hit) reasons.push(rule.reason);
    }
    return { flagged: reasons.length > 0, reasons };
}

// Replace the sensitive bits with a notice so the other person never sees them.
export function maskText(text = "") {
    let out = text;
    out = out.replace(RULES[0].re, "[link removed]");
    out = out.replace(RULES[1].re, "[email removed]");
    out = out.replace(RULES[2].re, "[payment id removed]");
    out = out.replace(/(\+?\d[\d\s().-]{8,}\d)/g, "[number removed]");
    return out;
}
