// Trust score (0-100) shown on profiles. Pure function of the user's stats.
export function computeTrustScore(user) {
    const s = user.stats || {};
    const v = user.verification || {};
    let score = 10;
    if (v.emailVerified) score += 10;
    if (v.status === "verified") score += 25;
    score += Math.min(s.completedOrders || 0, 10) * 3; // up to +30
    if (s.ratingCount > 0) score += Math.round(((s.ratingAvg || 0) / 5) * 20); // up to +20
    if (s.completedOrders > 0) score += Math.round(((s.onTimeOrders || 0) / s.completedOrders) * 5); // up to +5
    score -= (s.reportCount || 0) * 10;
    score -= (s.fraudStrikes || 0) * 5;
    return Math.max(0, Math.min(100, score));
}

export const NEW_TALENT_MAX_ORDERS = 3;
