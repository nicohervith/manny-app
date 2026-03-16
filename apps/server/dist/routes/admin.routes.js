import { Router } from "express";
import { getPendingWorkers, verifyWorker, } from "../controllers/admin.controller.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
const router = Router();
router.get("/pending-workers", isAdmin, getPendingWorkers);
router.patch("/verify-worker", isAdmin, verifyWorker);
export default router;
