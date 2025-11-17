import express from "express";
import { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  "https://shopping-store-frontend-nine.vercel.app",
];

dotenv.config();

const PORT = process.env.PORT || 5000;

const app: Application = express();

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// registering middlewares
app.use(cors(corsOptions)); // cors security
app.use(express.json()); // parsing middleware

// routes
app.get("/", (req, res) => {
  res.send("Hello from TypeScript + Express 👋");
});

// global error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("GLOBAL ERROR:", error.stack);
  res.status(500).json(error.message || "Internal Server Error");
});

app.listen(PORT, (error?: Error) => {
  if (error) {
    console.error("Error starting Server!");
  } else {
    console.log(`Server running on port: ${PORT}`);
  }
});
