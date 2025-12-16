/**
 * Simple Email Configuration Test
 * Run this file to verify Gmail SMTP configuration
 *
 * Usage: node test-email-config.js
 */

require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");

console.log("🔧 Email Configuration Test\n");
console.log("━".repeat(50));

// Read environment variables
const gmailFrom = process.env.GMAIL_FROM?.trim();
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

console.log("📧 GMAIL_FROM:", gmailFrom || "❌ NOT SET");
console.log(
  "🔑 GMAIL_APP_PASSWORD:",
  gmailPassword ? "✅ SET (hidden)" : "❌ NOT SET"
);
console.log("━".repeat(50) + "\n");

if (!gmailFrom || !gmailPassword) {
  console.error("❌ Missing email configuration!");
  console.log("\nPlease check your .env.local file:");
  console.log("  GMAIL_FROM=your-email@gmail.com");
  console.log("  GMAIL_APP_PASSWORD=your-app-password");
  process.exit(1);
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: gmailFrom,
    pass: gmailPassword,
  },
});

console.log("🔌 Testing SMTP connection...\n");

transporter
  .verify()
  .then(() => {
    console.log("✅ Email configuration is VALID!");
    console.log("✅ SMTP connection successful");
    console.log("✅ Ready to send emails\n");

    console.log("━".repeat(50));
    console.log("Next steps:");
    console.log("1. Start dev server: npm run dev");
    console.log("2. Test API endpoint: POST /api/admin/create-evaluator");
    console.log("━".repeat(50));

    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Email configuration ERROR!\n");
    console.error("Error details:", error.message);
    console.log("\n━".repeat(50));
    console.log("Common Issues:");
    console.log("1. Invalid App Password");
    console.log(
      "   → Generate new at: https://myaccount.google.com/apppasswords"
    );
    console.log("2. 2-Factor Authentication not enabled");
    console.log("   → Enable at: https://myaccount.google.com/security");
    console.log("3. Firewall blocking port 587");
    console.log("   → Check firewall/antivirus settings");
    console.log("4. Wrong email format");
    console.log("   → Use format: your-email@gmail.com (no spaces)");
    console.log("━".repeat(50));

    process.exit(1);
  });
