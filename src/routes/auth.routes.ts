import { Router } from "express";
import { validate } from "../middleware/validate";
import { loginUserSchema } from "../validation/user.validation";
import {
  login,
  refreshAccessToken,
  logout,
} from "../controllers/auth.controller";

const router = Router();

router.post("/login", validate(loginUserSchema), login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;

