import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import {
  forgotPassword,
  resetPassword,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
