import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware.ts";
const router = Router();

// Retrieve all doctor profiles with stats
router.get("/", DoctorController.listDoctors);

// Add a new doctor
router.post("/", DoctorController.addDoctor);

// Update doctor status
router.patch(
    "/:id/status",
    authMiddleware,
    authorizeRoles(["admin"]),
    DoctorController.updateStatus
);
export default router;
