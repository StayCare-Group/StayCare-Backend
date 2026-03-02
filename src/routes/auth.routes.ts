import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginUserSchema } from "../validation/user.validation";
import { authenticate } from "../middleware/authenticate";
import {
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateMe,
} from "../controllers/auth.controller";

const router = Router();

router.post("/login", validate(loginUserSchema), login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

export default router;

