import nodemailer from "nodemailer";

interface IEmailParams {
  email: string;
  patientName: string;
  doctorName: string;
  schedule: Date;
  type: "booked" | "confirmed" | "cancelled";
  note?: string;
  cancellationReason?: string;
}

export class NotificationService {
  private static getTransporter() {
    // If SMTP host/port/user are provided in env, use real email transport
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    // Otherwise, simulate sending by logging beautifully to console
    return null;
  }

  static async sendAppointmentEmail(params: IEmailParams): Promise<void> {
    const formattedDate = new Date(params.schedule).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let subject = "";
    let bodyText = "";
    let htmlContent = "";

    switch (params.type) {
      case "booked":
        subject = `🩺 Appointment Booking Requested | Healthcare Portal`;
        bodyText = `Hello ${params.patientName},\n\nYour appointment booking request with ${params.doctorName} on ${formattedDate} is received and pending validation.\n\nWarm regards,\nHealthcare Team`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #eff6ff; padding-bottom: 10px;">🩺 Appointment Booking Received</h2>
            <p>Dear <strong>${params.patientName}</strong>,</p>
            <p>We have successfully received your appointment request. Here are the pending details:</p>
            <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin: 15px 0;">
              <tr><td style="padding: 8px; font-weight: bold; width: 150px;">Practitioner:</td><td style="padding: 8px;">${params.doctorName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Requested Date:</td><td style="padding: 8px;">${formattedDate}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; color: #d97706; font-weight: bold;">Pending Confirmation</td></tr>
            </table>
            <p>We will review your booking shortly. You will receive another notification once confirmed.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `;
        break;

      case "confirmed":
        subject = `✅ Appointment Confirmed | Healthcare Portal`;
        bodyText = `Hello ${params.patientName},\n\nYour appointment with ${params.doctorName} on ${formattedDate} has been officially confirmed!\n\nWarm regards,\nHealthcare Team`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10b981; border-bottom: 2px solid #ecfdf5; padding-bottom: 10px;">✅ Appointment Officially Confirmed</h2>
            <p>Dear <strong>${params.patientName}</strong>,</p>
            <p>Great news! Your booking has been verified and scheduled by our staff.</p>
            <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin: 15px 0;">
              <tr><td style="padding: 8px; font-weight: bold; width: 150px;">Practitioner:</td><td style="padding: 8px;">${params.doctorName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Date & Time:</td><td style="padding: 8px;">${formattedDate}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; color: #10b981; font-weight: bold;">Scheduled / Confirmed</td></tr>
              ${params.note ? `<tr><td style="padding: 8px; font-weight: bold;">Physician Note:</td><td style="padding: 8px; font-style: italic;">"${params.note}"</td></tr>` : ""}
            </table>
            <p>Please arrive 10 minutes prior to your scheduled slot with your insurance card.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `;
        break;

      case "cancelled":
        subject = `❌ Appointment Cancellation Notification`;
        bodyText = `Hello ${params.patientName},\n\nWe regret to inform you that your appointment with ${params.doctorName} on ${formattedDate} has been cancelled. Reason: ${params.cancellationReason || "No reason specified"}\n\nWarm regards,\nHealthcare Team`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ef4444; border-bottom: 2px solid #fef2f2; padding-bottom: 10px;">❌ Appointment Cancelled</h2>
            <p>Dear <strong>${params.patientName}</strong>,</p>
            <p>Your scheduled appointment with <strong>${params.doctorName}</strong> on <strong>${formattedDate}</strong> has been cancelled.</p>
            <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 12px; border-radius: 6px; margin: 15px 0;">
              <strong style="color: #b91c1c;">Cancellation Reason:</strong><br/>
              <span style="color: #7f1d1d;">${params.cancellationReason || "Cancelled by provider/scheduling agent."}</span>
            </div>
            <p>If you'd like to reschedule, please visit our online portal to submit a new scheduling request.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `;
        break;
    }

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"CarePulse Healthcare" <${process.env.SMTP_USER}>`,
          to: params.email,
          subject,
          text: bodyText,
          html: htmlContent,
        });
        console.log(`✉️ Email notification sent successfully to: ${params.email}`);
      } catch (mailingError) {
        console.error("❌ NodeMailer failed to transmit actual email:", mailingError);
      }
    } else {
      console.log("------------------ CarePulse Notification Log ------------------");
      console.log(`To: ${params.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${bodyText}`);
      console.log("----------------------------------------------------------------");
    }
  }
}
