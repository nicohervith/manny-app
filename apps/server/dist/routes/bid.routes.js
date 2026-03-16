import { Router } from "express";
import { applyBid, getJobBids, getWorkerBids, } from "../controllers/bid.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/apply", authenticateToken, applyBid);
router.get("/worker/:workerId", authenticateToken, getWorkerBids);
router.get("/job/:jobId", authenticateToken, getJobBids);
export default router;
