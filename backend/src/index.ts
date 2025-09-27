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
import type { Request, Response, NextFunction } from "express";


const numCPUs = os.cpus().length;

// Allowed origins
const allowedOrigins = [
  "https://brainly-seven-iota.vercel.app",
];

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

  const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow Postman, curl, or requests with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked request from: ${origin}`);
      callback(null, false); // use false instead of throwing error
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS **before all routes**
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable preflight for all routes

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
  // Routes
  app.get("/", (req, res) => {
    res.json({ message: `Brainly backend process: ${process.pid}` });
  });

  app.post("/api/v1/signup", Signup);
  app.post("/api/v1/signin", Signin);
  app.post("/api/v1/content", userMiddleware, PostContent);
  app.get("/api/v1/content", userMiddleware, GetContent);
  app.put("/api/v1/content", userMiddleware, PutContent);
  app.delete("/api/v1/content", userMiddleware, DeleteContent);
  app.post("/api/v1/brain/share", userMiddleware, PostShareBrain);
  app.get("/api/v1/brain/:shareLink", GetShareBrain);


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({ error: "CORS blocked", origin: req.headers.origin });
  } else {
    next(err);
  }
});


  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started and listening on port 3000`);
  });
}
