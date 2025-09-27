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

// Allowed origins
const allowedOrigins = [
  "https://brainly-seven-iota.vercel.app",
  "https://brainly-juji731xc-bytewizard12s-projects.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
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
  app.use(express.json());

  // ✅ Dynamic CORS (supports array + *.vercel.app)
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true); // allow Postman / curl

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") // allow all Vercel preview domains
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // Preflight

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

  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started and listening on port 3000`);
  });
}
