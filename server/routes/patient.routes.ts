import { Router } from "express";
import { PatientController } from "../controllers/patient.controller";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload";

const router = Router();

// Save patient profile with document attachment
router.post(
  "/register",
  authMiddleware,
  upload.single("document"),
  PatientController.registerPatient
);

// Get currently logged-in user's patient profile
router.get("/me", authMiddleware, PatientController.getMyProfile);

// Update currently logged-in user's patient profile
router.put("/me", authMiddleware, PatientController.updateMyProfile);

// Get any patient's profile (authorized for administrative personnel / doctors)
router.get(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin", "doctor"]),
  PatientController.getPatientById
);

export default router;
