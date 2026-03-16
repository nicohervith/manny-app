// apps/server/src/routes/chat.routes.ts
import { Router } from "express";
import {
  getMessages,
  listChats,
  markAsRead,
  sendMessage,
} from "../controllers/chat.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/send", authenticateToken, sendMessage);
router.get("/list/:userId", authenticateToken, listChats);
router.get("/:jobId", authenticateToken, getMessages);
router.patch("/read-all/:jobId/:userId", authenticateToken, markAsRead);

export default router;
