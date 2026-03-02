import { Router } from "express";
import { getMachineStatus } from "../controllers/facility.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authenticate);

router.get("/machines", authorize("admin", "staff"), getMachineStatus);

export default router;

