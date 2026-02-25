import express from "express";
import { validate } from "./middleware/validate";
import { createUserSchema } from "./validation/user.validation";
import userRoutes from "./routes/user.routes";
import healthRoutes from "./routes/health.routes";
import cors from "cors";



const app = express();

app.use(
    cors({
      origin: "*",
      credentials: true,
    }),
  );

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/health", healthRoutes);

export default app;