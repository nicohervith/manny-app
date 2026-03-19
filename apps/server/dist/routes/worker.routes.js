import { Router } from "express";
import { completeProfile, completeWorkerJob, getWorkerProfile, getWorkerVerificationStatus, listWorkers, verifyWorkerStatus, } from "../controllers/worker.controller.js";
import { upload } from "../lib/cloudinary.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";
const router = Router();
const uploadFields = upload.fields([
    { name: "dniFront", maxCount: 1 },
    { name: "dniBack", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
]);
router.post("/complete-profile", authenticateToken, (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            console.error("❌ Error de Multer/Cloudinary:", err);
            return res
                .status(400)
                .json({ error: "Error al subir archivos", details: err.message });
        }
        next();
    });
}, completeProfile);
router.get("/list", authenticateToken, listWorkers);
router.get("/profile/:userId", authenticateToken, getWorkerProfile);
router.patch("/:id/complete-worker", authenticateToken, completeWorkerJob);
router.patch("/verify-worker/:userId", authenticateToken, isAdmin, verifyWorkerStatus);
router.get("/status/:userId", authenticateToken, getWorkerVerificationStatus);
export default router;
