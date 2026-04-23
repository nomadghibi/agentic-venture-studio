import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  if (!env.SMTP_HOST) {
    // Dev: log to console so the link is accessible without SMTP configured.
    console.log(`\n[PASSWORD RESET]\nTo:   ${to}\nLink: ${resetLink}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {})
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Reset your password — Agentic Venture Studio",
    text: [
      "You requested a password reset for your Agentic Venture Studio account.",
      "",
      `Reset link (expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes):`,
      resetLink,
      "",
      "If you did not request this, you can safely ignore this email."
    ].join("\n"),
    html: `
      <p>You requested a password reset for your Agentic Venture Studio account.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#0f8a8d;color:#fff;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p style="color:#888;font-size:0.85em;">
        Link expires in ${env.PASSWORD_RESET_TTL_MINUTES} minutes.
        If you did not request this, you can safely ignore this email.
      </p>
    `
  });
}
