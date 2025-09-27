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

if (cluster.isPrimary) {
    console.log(`Primary process ${process.pid} is running`);
    // Fork workers.
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
    app.use(
        cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, postman, etc.)
                if (!origin) return callback(null, true);
                
                // List of allowed origins
                const allowedOrigins = [
                    "https://brainly-seven-iota.vercel.app",
                    "https://brainly-juji731xc-bytewizard12s-projects.vercel.app",
                    "http://localhost:5173",
                    "http://localhost:3000"
                ];
                
                // Check if origin is in allowed list or is a vercel.app subdomain
                if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        })
    );

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
    app.delete("/api/v1/content", userMiddleware, DeleteContent)
    app.post("/api/v1/brain/share", userMiddleware, PostShareBrain);
    app.get("/api/v1/brain/:shareLink", GetShareBrain);

    app.listen(3000, () => {
        console.log(`Worker ${process.pid} started and listening on port 3000`);
    });
}