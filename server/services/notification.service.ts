import nodemailer from "nodemailer";

interface IEmailParams {
  email: string;
  patientName: string;
  doctorName: string;
  schedule: Date;
  type: "booked" | "confirmed" | "cancelled" | "rescheduled" | "completed";
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
      console.log("SMTP_HOST =", process.env.SMTP_HOST);
      console.log("SMTP_PORT =", process.env.SMTP_PORT);
      console.log("SMTP_USER =", process.env.SMTP_USER);
      console.log("SMTP_PASS EXISTS =", !!process.env.SMTP_PASS);
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

      case "rescheduled":
        subject = `🕒 Appointment Rescheduled | Healthcare Portal`;
        bodyText = `Hello ${params.patientName},\n\nYour appointment with ${params.doctorName} has been rescheduled to ${formattedDate}.\n\nWarm regards,\nHealthcare Team`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #eff6ff; padding-bottom: 10px;">🕒 Appointment Rescheduled</h2>
            <p>Dear <strong>${params.patientName}</strong>,</p>
            <p>Your appointment with <strong>${params.doctorName}</strong> has been rescheduled. Here are the new details:</p>
            <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin: 15px 0;">
              <tr><td style="padding: 8px; font-weight: bold; width: 150px;">Practitioner:</td><td style="padding: 8px;">${params.doctorName}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">New Date & Time:</td><td style="padding: 8px;">${formattedDate}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; color: #2563eb; font-weight: bold;">Rescheduled</td></tr>
              ${params.note ? `<tr><td style="padding: 8px; font-weight: bold;">Note:</td><td style="padding: 8px; font-style: italic;">"${params.note}"</td></tr>` : ""}
            </table>
            <p>Please update your calendar. If this time does not work for you, please contact us or request a change.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `;
        break;

      case "completed":
        subject = `✅ Appointment Completed | Healthcare Portal`;
        bodyText = `Hello ${params.patientName},\n\nYour appointment with ${params.doctorName} on ${formattedDate} has been marked as completed. Thank you for visiting.\n\nWarm regards,\nHealthcare Team`;
        htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10b981; border-bottom: 2px solid #ecfdf5; padding-bottom: 10px;">✅ Appointment Completed</h2>
            <p>Dear <strong>${params.patientName}</strong>,</p>
            <p>Your appointment with <strong>${params.doctorName}</strong> on <strong>${formattedDate}</strong> has been marked as successfully completed.</p>
            <p>Thank you for choosing CarePulse for your healthcare needs.</p>
            ${params.note ? `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin: 15px 0;">
              <strong style="color: #166534;">Specialist Notes:</strong><br/>
              <span style="color: #15803d;">${params.note}</span>
            </div>` : ""}
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

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const subject = `🔑 Password Reset Request | CarePulse`;
    const bodyText = `Hello,\n\nYou requested a password reset for your CarePulse account. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes.\n\nWarm regards,\nCarePulse Team`;
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #eff6ff; padding-bottom: 10px;">🔑 Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your CarePulse account. Please click the button below to reset your password:</p>
        <div style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste the link below into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for 15 minutes. If you did not request this reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"CarePulse Healthcare" <${process.env.SMTP_USER}>`,
          to: email,
          subject,
          text: bodyText,
          html: htmlContent,
        });
        console.log(`✉️ Password reset email sent successfully to: ${email}`);
      } catch (mailingError) {
        console.error("❌ NodeMailer failed to transmit reset email:", mailingError);
      }
    } else {
      console.log("------------------ CarePulse Reset Password Notification Log ------------------");
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link: ${resetUrl}`);
      console.log("----------------------------------------------------------------");
    }
  }
}
