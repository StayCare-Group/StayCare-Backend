import express from "express";
import { validate } from "./middleware/validate";
import { createUserSchema } from "./validation/user.validation";
import userRoutes from "./routes/user.routes";
import healthRoutes from "./routes/health.routes";


const app = express();

app.use(express.json());
app.use("/api/users", validate(createUserSchema), userRoutes);
app.use("/api/health", healthRoutes);

export default app;