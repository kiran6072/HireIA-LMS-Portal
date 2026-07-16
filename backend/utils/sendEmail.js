const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

const brandWrapper = (bodyHtml) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background:#0B2A5B; padding: 24px; text-align:center;">
      <h1 style="color:#ffffff; margin:0; font-size:22px; letter-spacing:0.5px;">HireIA <span style="color:#F57C00;">LMS</span></h1>
    </div>
    <div style="padding: 28px; background:#ffffff; color:#1a1a1a; border:1px solid #e5e7eb; border-top:none;">
      ${bodyHtml}
    </div>
    <div style="padding: 16px; text-align:center; color:#94a3b8; font-size:12px;">
      &copy; ${new Date().getFullYear()} HireIA LMS. All rights reserved.
    </div>
  </div>
`;

/**
 * Send an email. Fails silently (logs) in development if SMTP isn't configured,
 * so the rest of the app flow (e.g. registration) is never blocked by email delivery.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn(`[Email] SMTP not configured. Skipping email to ${to}: "${subject}"`);
      return { skipped: true };
    }
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'HireIA LMS <no-reply@hireia.com>',
      to,
      subject,
      html: brandWrapper(html),
      text,
    });
    return info;
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
    return { error: err.message };
  }
};

module.exports = { sendEmail, brandWrapper };
