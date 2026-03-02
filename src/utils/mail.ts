import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvitationEmail(
  to: string,
  role: string,
  inviteUrl: string,
) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `You've been invited to StayCare as ${roleLabel}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #FF56B0;">Welcome to StayCare!</h2>
        <p>You've been invited to join StayCare as a <strong>${roleLabel}</strong>.</p>
        <p>Click the button below to create your account. This link expires in <strong>24 hours</strong>.</p>
        <a href="${inviteUrl}"
           style="display: inline-block; margin: 24px 0; padding: 12px 32px;
                  background: #FF56B0; color: #fff; text-decoration: none;
                  border-radius: 8px; font-weight: bold;">
          Create Your Account
        </a>
        <p style="color: #888; font-size: 13px;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${inviteUrl}" style="color: #FF56B0;">${inviteUrl}</a>
        </p>
      </div>
    `,
  });
}
