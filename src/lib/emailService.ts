import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";

// Email transporter configuration
const createTransporter = (): Transporter => {
  const gmailFrom = process.env.GMAIL_FROM?.trim();
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailFrom || !gmailPassword) {
    throw new Error(
      "Missing email configuration. Please set GMAIL_FROM and GMAIL_APP_PASSWORD in .env.local"
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: gmailFrom,
      pass: gmailPassword,
    },
    // Force IPv4 to avoid ETIMEOUT on some networks
    family: 4,
  } as nodemailer.TransportOptions);
};

let transporter: Transporter | null = null;

/**
 * Get or create email transporter
 */
const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const t = getTransporter();
    await t.verify();
    console.log("✅ Email transporter verified successfully");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Email transporter verification failed:", error);
    return {
      success: false,
      error: error.message || "Email configuration verification failed",
    };
  }
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send evaluator credentials via email
 * @param to - Recipient email address
 * @param username - Username for the evaluator (usually the email)
 * @param password - Generated password
 * @returns Result of email sending operation
 */
export async function sendEvaluatorCredentials(
  to: string,
  username: string,
  password: string
): Promise<EmailResult> {
  try {
    if (!to || !username || !password) {
      throw new Error("Missing required parameters: to, username, or password");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid email format: ${to}`);
    }

    const t = getTransporter();
    const gmailFrom = process.env.GMAIL_FROM?.trim();
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"}`;

    const mailOptions = {
      from: {
        name: "HTGA - Restaurant Evaluation System",
        address: gmailFrom!,
      },
      to,
      subject: "Your Evaluator Account Credentials",
      text: `
Hello,

Your evaluator account has been successfully created by the admin. Here are your login credentials:

Username: ${username}
Password: ${password}

Please login to the system: ${loginUrl}

IMPORTANT: Please change your password immediately after your first login for account security.

Thank you,
HTGA Admin Team
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #A67C37 0%, #8B6B30 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A67C37; }
    .credential-item { margin: 15px 0; }
    .label { font-weight: bold; color: #A67C37; }
    .value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 12px 30px; background: #A67C37; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
    a { color: #A67C37; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Your Evaluator Account</h1>
    <p>Welcome to HTGA Restaurant Evaluation System</p>
  </div>
  <div class="content">
    <p>Hello,</p>
    <p>Your evaluator account has been successfully created by the admin. Here are your login credentials:</p>
    
    <div class="credentials">
      <div class="credential-item">
        <div class="label">📧 Username</div>
        <div class="value">${username}</div>
      </div>
      <div class="credential-item">
        <div class="label">🔑 Password</div>
        <div class="value">${password}</div>
      </div>
    </div>

    <div class="warning">
      <strong>⚠️ IMPORTANT:</strong> Please change your password immediately after your first login for account security.
    </div>

    <p style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" class="button">
        Login to System
      </a>
    </p>

    <div class="footer">
      <p>If you did not expect this email, please ignore it or contact the admin.</p>
      <p>Thank you,<br>HTGA Admin Team</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    };

    console.log(`📧 Sending credentials to: ${to}`);
    const info = await t.sendMail(mailOptions);
    console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send test email (for debugging)
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  try {
    const t = getTransporter();
    const gmailFrom = process.env.GMAIL_FROM?.trim();

    const mailOptions = {
      from: gmailFrom,
      to,
      subject: "Test Email - Configuration Check",
      text: "This is a test email to verify email configuration.",
    };

    const info = await t.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send a generic notification email
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<EmailResult> {
  try {
    const t = getTransporter();
    const gmailFrom = process.env.GMAIL_FROM?.trim();

    const mailOptions = {
      from: {
        name: "HTGA Notification",
        address: gmailFrom!,
      },
      to,
      subject,
      text,
      html: html || text,
    };

    console.log(`📧 Sending notification email to: ${to}`);
    const info = await t.sendMail(mailOptions);
    console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ Error sending notification email:", error);
    return {
      success: false,
      error: error.message || "Failed to send notification email",
    };
  }
}
