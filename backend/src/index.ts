import dotenv from 'dotenv';
dotenv.config();

import cluster from 'cluster';
import os from 'os';
import express from "express";
import { ContentModel, LinkModel, UserModel } from "./db";
import { JWT_PASSWORD, frontendUrl } from "./config";
import { userMiddleware } from "./middleware";
import cors from "cors";
import { Signin, Signup } from "./routes/auth";
import { DeleteContent, GetContent, PostContent, PutContent } from "./routes/content";
import { GetShareBrain, PostShareBrain } from "./routes/brain";

const numCPUs = os.cpus().length;

const allowedOrigins = [
    "https://brainly-seven-iota.vercel.app",
    "https://brainly-juji731xc-bytewizard12s-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
];

function corsOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true); // allow server-to-server, mobile, Postman
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
    } else {
        callback(new Error("Not allowed by CORS"));
    }
}

if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Spawning a new one...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(express.json());

    // CORS middleware (with credentials and dynamic origin)
    app.use(cors({
        origin: corsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));

    // Explicit preflight OPTIONS handler for every route
    app.options("*", cors({
        origin: corsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }));

    app.get("/", (req, res) => {
        res.json({
            message: `Brainly backend process: ${process.pid}`
        });
    });

    app.post("/api/v1/signup", Signup);
    app.post("/api/v1/signin", Signin);
    app.post("/api/v1/content", userMiddleware, PostContent);
    app.get("/api/v1/content", userMiddleware, GetContent);
    app.put("/api/v1/content", userMiddleware, PutContent);
    app.delete("/api/v1/content", userMiddleware, DeleteContent);
    app.post("/api/v1/brain/share", userMiddleware, PostShareBrain);
    app.get("/api/v1/brain/:shareLink", GetShareBrain);

    // Optional: generic error handler for CORS errors
    // app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    //     if (err.message && err.message.includes("CORS")) {
    //         return res.status(403).json({ error: "CORS error: Origin not allowed" });
    //     }
    //     next(err);
    // });

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started and listening on port 3000`);
    });
}