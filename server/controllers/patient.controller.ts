import { Response, NextFunction } from "express";
import { PatientService } from "../services/patient.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export class PatientController {
  static async registerPatient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // If document file was uploaded by multer, extract dynamic local path
      let documentUrl = "";
      if (req.file) {
        documentUrl = `/uploads/${req.file.filename}`;
      }

      const parsedFormData = req.body.data ? JSON.parse(req.body.data) : req.body;

      const profile = await PatientService.registerPatient(
        req.user.userId,
        parsedFormData,
        documentUrl
      );

      res.status(201).json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  static async getMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const profile = await PatientService.getPatientProfile(req.user.userId);
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  }

  static async getPatientById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await PatientService.getPatientById(id);
      if (!profile) {
        res.status(404).json({ error: "Patient profile not found" });
        return;
      }
      res.status(200).json({ profile });
    } catch (err) {
      next(err);
    }
  }

  static async updateMyProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const updated = await PatientService.updatePatientProfile(req.user.userId, req.body);
      res.status(200).json({ success: true, profile: updated });
    } catch (err) {
      next(err);
    }
  }
}
export default PatientController;
