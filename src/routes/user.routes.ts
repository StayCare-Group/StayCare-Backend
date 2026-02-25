import { Router } from "express";
import { createUser, loginUser } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { createUserSchema, loginUserSchema } from "../validation/user.validation";

const router = Router();

router.post("/", validate(createUserSchema), createUser);
router.post("/login", validate(loginUserSchema), loginUser);

export default router;