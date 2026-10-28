// Small helpers shared by controllers.
export class HttpError extends Error {
    constructor(status, message, extra = {}) {
        super(message);
        this.status = status;
        Object.assign(this, extra);
    }
}

// Wrap an async route handler so thrown errors reach the Express error handler.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function assert(condition, status, message) {
    if (!condition) throw new HttpError(status, message);
}
