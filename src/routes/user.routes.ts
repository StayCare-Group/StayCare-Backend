import { Router } from "express";
import { createUser } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { createUserSchema } from "../validation/user.validation";

const router = Router();

router.post("/", validate(createUserSchema), createUser);

export default router;