import { Router } from "express";
import {
  acceptBid,
  adjustBudget,
  createJob,
  getAvailableJobs,
  getClientJobs,
  getWorkerFeed,
  updateJobStatus,
} from "../controllers/job.controller.js";
import { upload } from "../lib/cloudinary.js";

const router = Router();

router.post("/create", upload.array("images", 5), createJob);
router.post("/adjust-budget", adjustBudget);
router.post("/accept-bid", acceptBid);
router.get("/available", getAvailableJobs);
router.get("/client/:clientId", getClientJobs);
router.get("/feed/:workerId", getWorkerFeed);
router.patch("/:id/status", updateJobStatus);

export default router;
