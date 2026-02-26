import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginUserSchema, registerUserSchema } from "../validation/user.validation";
import { authenticate } from "../middleware/authenticate";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", validate(registerUserSchema), register);
router.post("/login", validate(loginUserSchema), login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;

