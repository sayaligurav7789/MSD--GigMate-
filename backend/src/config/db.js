import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Accepts MONGO_URL (see .env.example) or MONGODB_URI.
export const connectDB = async () => {
    const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
    if (!uri) throw new Error("Set MONGO_URL (or MONGODB_URI) in backend/.env");
    const conn = await mongoose.connect(uri, { dbName: DB_NAME });
    console.log(`MongoDB connected: ${conn.connection.host}/${DB_NAME}`);
};
