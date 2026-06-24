import { Router } from "express";
import { BloodController } from "../controllers/blood.controller";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// DONORS
router.get("/donors", authMiddleware, BloodController.listDonors);
router.post("/donors", authMiddleware, BloodController.addDonor);
router.patch("/donors/:id/status", authMiddleware, authorizeRoles(["admin"]), BloodController.updateDonorStatus);

// REQUESTS
router.get("/requests", authMiddleware, BloodController.listRequests);
router.post("/requests", authMiddleware, BloodController.addRequest);
router.patch("/requests/:id/status", authMiddleware, authorizeRoles(["admin"]), BloodController.updateRequestStatus);

export default router;
