// apps/server/src/routes/payment.routes.ts
import { Router } from "express";
import { createPreference, getAuthUrl, oauthCallback, webhook, } from "../controllers/payment.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/create-preference", authenticateToken, createPreference);
router.post("/webhook", authenticateToken, webhook);
router.get("/auth/url/:workerId", authenticateToken, getAuthUrl);
router.get("/oauth/callback", authenticateToken, oauthCallback);
export default router;
