const nodemailer = require("nodemailer");

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

if (!SMTP_USER || !SMTP_PASS) {
  console.warn("⚠️ Missing SMTP_USER or SMTP_PASS in .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function sendMail(to, subject, html) {
  if (!to) throw new Error("sendMail: missing recipient email");
  if (!subject) subject = "Sport Zone Notification";
  if (!html) html = "<p>Notification</p>";

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  return info;
}

module.exports = { sendMail };
