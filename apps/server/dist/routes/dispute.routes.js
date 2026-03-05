import { Router } from "express";
import { createDispute } from "../controllers/dispute.controller.js";
const router = Router();
router.post("/", createDispute);
export default router;
