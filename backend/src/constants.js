export const DB_NAME = "gigmate";
export const AUTO_RELEASE_DAYS = Number(process.env.AUTO_RELEASE_DAYS) || 7;
export const MAX_TOPUP = 50000;
export const ORDER_STATUSES = ["pending", "in-progress", "delivered", "completed", "cancelled", "disputed"];
// Students must sign up with an academic address (.edu, .ac.in, .edu.in, .ac.uk ...).
export const COLLEGE_EMAIL_RE = /\.(edu|ac)(\.[a-z]{2})?$/i;
