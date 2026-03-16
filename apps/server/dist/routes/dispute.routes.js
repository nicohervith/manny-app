import { Router } from "express";
import { createDispute, getDisputes, resolveDispute, } from "../controllers/dispute.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/", authenticateToken, createDispute);
router.get("/", authenticateToken, getDisputes);
router.patch("/:id/resolve", authenticateToken, resolveDispute);
export default router;
