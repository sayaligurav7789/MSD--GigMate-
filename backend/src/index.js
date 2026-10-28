import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const server = app.listen(PORT, HOST, () => {
    console.log(`[GigMate API] listening on http://${HOST}:${PORT}`);
});
(async () => {
    try {
        await connectDB();
        console.log("[GigMate API] database ready");
    }
    catch (err) {
        console.error("[GigMate API] failed to connect to database:", err);
        server.close();
        process.exit(1);
    }
})();
