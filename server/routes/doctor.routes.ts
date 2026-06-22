import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";

const router = Router();

// Retrieve all active doctor profiles for dropdown selectors
router.get("/", DoctorController.listDoctors);
router.post("/", DoctorController.addDoctor);
router.get("/stats", DoctorController.getDoctorsStats);

export default router;
