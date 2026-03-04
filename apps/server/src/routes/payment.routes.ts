// apps/server/src/routes/payment.routes.ts

import { Router } from "express";
import {
  createPreference,
  getAuthUrl,
  oauthCallback,
  webhook,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/create-preference", createPreference);
router.post("/webhook", webhook);
router.get("/auth/url/:workerId", getAuthUrl);
router.get("/oauth/callback", oauthCallback);

export default router;
