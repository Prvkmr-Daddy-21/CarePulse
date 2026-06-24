import { Router } from "express";
import { BloodController } from "../controllers/blood.controller";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { z } from "zod";

const requestSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  unitsRequired: z.number().min(1, "Units must be at least 1"),
  hospitalName: z.string().min(1, "Hospital name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  patientId: z.string().optional(),
  urgency: z.string().optional()
});

const donorSchema = z.object({
  patientName: z.string().min(1, "Name is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  contactPhone: z.string().optional(),
  medicalConditions: z.string().optional(),
  availability: z.boolean().optional(),
  patientId: z.string().optional()
});

const router = Router();

// DONORS
router.get("/donors", authMiddleware, authorizeRoles(["admin", "doctor"]), BloodController.listDonors);
router.post("/donors", authMiddleware, validateRequest(donorSchema), BloodController.addDonor);
router.patch("/donors/:id/status", authMiddleware, authorizeRoles(["admin"]), BloodController.updateDonorStatus);

// REQUESTS
router.get("/requests", authMiddleware, authorizeRoles(["admin", "doctor"]), BloodController.listRequests);
router.post("/requests", authMiddleware, validateRequest(requestSchema), BloodController.addRequest);
router.patch("/requests/:id/status", authMiddleware, authorizeRoles(["admin"]), BloodController.updateRequestStatus);

export default router;
