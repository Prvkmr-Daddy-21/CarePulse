import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { authMiddleware, authorizeRoles } from "../middleware/auth.middleware";

const router = Router();

// Retrieve available slots (Patients need access to this)
router.get(
  "/available-slots",
  authMiddleware,
  AppointmentController.getAvailableSlots
);

// Retrieve appointments list (Admin/Doctor authorized)
router.get(
  "/",
  authMiddleware,
  authorizeRoles(["admin", "doctor"]),
  AppointmentController.getAppointments
);

// Book new slot request (any logged-in patient/admin)
router.post(
  "/book",
  authMiddleware,
  AppointmentController.bookAppointment
);

// Get specific list of appointments for a particular patient (authorised)
router.get(
  "/patient/:patientId",
  authMiddleware,
  AppointmentController.getMyAppointments
);

// Trigger administrative update (schedule appointment or cancel booking)
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles(["admin", "doctor"]),
  AppointmentController.updateStatus
);

// Trigger administrative update (reschedule appointment)
router.patch(
  "/:id/reschedule",
  authMiddleware,
  authorizeRoles(["admin", "doctor"]),
  AppointmentController.reschedule
);

export default router;
