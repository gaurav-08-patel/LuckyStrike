import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import adminDrawRoutes from "./routes/adminDraws";
import drawsRoutes from "./routes/draws";
import ticketsRoutes from "./routes/tickets";
import userRoutes from "./routes/users";
import walletRoutes from "./routes/wallet";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Lucky Strike backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", walletRoutes);
app.use("/api", adminDrawRoutes);
app.use("/api", drawsRoutes);
app.use("/api", ticketsRoutes);

export default app;
