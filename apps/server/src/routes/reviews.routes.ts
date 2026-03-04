import { Router } from "express";
import { reviews } from "../controllers/review.controller.js";

const router = Router();

// POST /api/reviews
router.post("/", reviews);

export default router;
