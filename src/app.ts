import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

const corsOrigin = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

export default app;