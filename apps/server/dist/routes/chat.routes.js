// apps/server/src/routes/chat.routes.ts
import { Router } from "express";
import { getMessages, listChats, markAsRead, sendMessage, } from "../controllers/chat.controller.js";
const router = Router();
router.post("/send", sendMessage);
router.get("/list/:userId", listChats);
router.get("/:jobId", getMessages);
router.patch("/read-all/:jobId/:userId", markAsRead);
export default router;
