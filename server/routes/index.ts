import { Router } from "express";
import authRoutes from "./auth.routes";
import patientRoutes from "./patient.routes";
import appointmentRoutes from "./appointment.routes";
import doctorRoutes from "./doctor.routes";
import bloodRoutes from "./blood.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/doctors", doctorRoutes);
router.use("/blood", bloodRoutes);

export default router;
