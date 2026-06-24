import { Request, Response, NextFunction } from "express";
import { db } from "../db/db";

export class BloodController {
  // DONORS
  static async listDonors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const donors = await db.bloodDonors.find();
      res.status(200).json({ success: true, donors });
    } catch (err) {
      next(err);
    }
  }

  static async addDonor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, patientName, bloodGroup, medicalConditions } = req.body;
      const donor = await db.bloodDonors.create({
        patientId,
        patientName,
        bloodGroup,
        medicalConditions,
        status: "eligible",
      });
      res.status(201).json({ success: true, donor });
    } catch (err) {
      next(err);
    }
  }

  static async updateDonorStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await db.bloodDonors.findByIdAndUpdate(id, { status });
      res.status(200).json({ success: true, donor: updated });
    } catch (err) {
      next(err);
    }
  }

  // REQUESTS
  static async listRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await db.bloodRequests.find();
      res.status(200).json({ success: true, requests });
    } catch (err) {
      next(err);
    }
  }

  static async addRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, patientName, bloodGroup, unitsRequired, urgency, hospitalName, contactPhone } = req.body;
      const request = await db.bloodRequests.create({
        patientId,
        patientName,
        bloodGroup,
        unitsRequired,
        urgency,
        hospitalName,
        contactPhone,
        status: "pending",
        requestDate: new Date()
      });
      res.status(201).json({ success: true, request });
    } catch (err) {
      next(err);
    }
  }

  static async updateRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await db.bloodRequests.findByIdAndUpdate(id, { status });
      res.status(200).json({ success: true, request: updated });
    } catch (err) {
      next(err);
    }
  }
}

export default BloodController;
