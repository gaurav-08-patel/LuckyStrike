import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminDrawRoutes from "./routes/adminDraws";
import adminWithdrawalsRoutes from "./routes/adminWithdrawals";
import drawsRoutes from "./routes/draws";
import ticketsRoutes from "./routes/tickets";
import userRoutes from "./routes/users";
import supportRoutes from "./routes/support";
import walletRoutes from "./routes/wallet";
import withdrawalsRoutes from "./routes/withdrawals";
import winnersRoutes from "./routes/winners";

dotenv.config();

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  `${process.env.FRONTEND_URL || "http://localhost:5173"},https://uptimerobot.com`
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
  }),
);

app.options("*", cors());
app.use(express.json());
app.use("/public", express.static("public"));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "lucky-strike-backend",
    message: "Lucky Strike backend is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "lucky-strike-backend",
    message: "Lucky Strike backend is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/support", supportRoutes);
app.use("/api", walletRoutes);
app.use("/api", withdrawalsRoutes);
app.use("/api", adminDrawRoutes);
app.use("/api", adminWithdrawalsRoutes);
app.use("/api", drawsRoutes);
app.use("/api", ticketsRoutes);
app.use("/api", winnersRoutes);

export default app;
