import { Router } from "express";
import { createDispute, getDisputes, resolveDispute } from "../controllers/dispute.controller.js";

const router = Router();

router.post("/", createDispute);
router.get("/", getDisputes);
router.patch("/:id/resolve", resolveDispute);

export default router;
