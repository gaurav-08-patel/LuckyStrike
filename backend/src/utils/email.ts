import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type EmailTemplate =
  | "winner_notification"
  | "account_verification"
  | "otp_login"
  | "wallet_topup"
  | "general";

type EmailTheme = {
  name: string;
  background: string;
  panel: string;
  accent: string;
  accentSoft: string;
  accentStrong: string;
  text: string;
  muted: string;
  border: string;
  buttonText: string;
};

type EmailTemplateConfig = {
  subject: string;
  preview: string;
  text: string;
  heading: string;
  intro: string;
  actionLabel?: string;
  actionUrl?: string;
  details: Array<{ label: string; value: string }>;
};

const emailThemes: Record<EmailTemplate, EmailTheme> = {
  winner_notification: {
    name: "Lucky Strike Winner",
    background: "#f5f3ff",
    panel: "#ffffff",
    accent: "#7c3aed",
    accentSoft: "#ede9fe",
    accentStrong: "#4c1d95",
    text: "#111827",
    muted: "#6b7280",
    border: "rgba(124, 58, 237, 0.14)",
    buttonText: "#ffffff",
  },
  account_verification: {
    name: "Verification",
    background: "#eff6ff",
    panel: "#ffffff",
    accent: "#2563eb",
    accentSoft: "#dbeafe",
    accentStrong: "#1d4ed8",
    text: "#111827",
    muted: "#64748b",
    border: "rgba(37, 99, 235, 0.14)",
    buttonText: "#ffffff",
  },
  otp_login: {
    name: "Secure Login",
    background: "#fff7ed",
    panel: "#ffffff",
    accent: "#f59e0b",
    accentSoft: "#fef3c7",
    accentStrong: "#b45309",
    text: "#111827",
    muted: "#6b7280",
    border: "rgba(245, 158, 11, 0.18)",
    buttonText: "#111827",
  },
  wallet_topup: {
    name: "Wallet Credit",
    background: "#ecfdf5",
    panel: "#ffffff",
    accent: "#10b981",
    accentSoft: "#d1fae5",
    accentStrong: "#047857",
    text: "#111827",
    muted: "#6b7280",
    border: "rgba(16, 185, 129, 0.16)",
    buttonText: "#ffffff",
  },
  general: {
    name: "Lucky Strike",
    background: "#f8fafc",
    panel: "#ffffff",
    accent: "#0f172a",
    accentSoft: "#e2e8f0",
    accentStrong: "#1e293b",
    text: "#111827",
    muted: "#64748b",
    border: "rgba(15, 23, 42, 0.12)",
    buttonText: "#ffffff",
  },
};

const emailTemplates: Record<EmailTemplate, EmailTemplateConfig> = {
  winner_notification: {
    subject: "Congratulations! You won a Lucky Strike draw",
    preview: "Your prize has been credited to your wallet.",
    text: `Congratulations! You have won the Lucky Strike draw.\n\nWinner details:\n- Ticket: {ticketCode}\n- Draw: {drawCode}\n- Prize: {prizeTitle}\n- Amount Won: {prizeAmount}\n- User ID: {userId}\n\nYour prize amount has been credited to your wallet.\n\nThank you for playing Lucky Strike.`,
    heading: "You’re a winner!",
    intro:
      "Congratulations! Your Lucky Strike draw prize has been confirmed and credited to your wallet.",
    actionLabel: "View my wallet",
    actionUrl: `${process.env.FRONTEND_URL || "https://luckystrike.app"}/wallet`,
    details: [
      { label: "Ticket code", value: "{ticketCode}" },
      { label: "Draw code", value: "{drawCode}" },
      { label: "Prize", value: "{prizeTitle}" },
      { label: "Amount won", value: "{prizeAmount}" },
      { label: "User ID", value: "{userId}" },
    ],
  },
  account_verification: {
    subject: "Verify your Lucky Strike account",
    preview: "Complete your account verification in one click.",
    text: "Please verify your Lucky Strike account to continue.",
    heading: "Verify your account",
    intro:
      "Welcome to Lucky Strike. Please verify your account to finish setting up your profile and start playing safely.",
    actionLabel: "Verify account",
    actionUrl: `${process.env.FRONTEND_URL || "https://luckystrike.app"}/verify-email?token={token}`,
    details: [{ label: "Security check", value: "One-tap verification" }],
  },
  otp_login: {
    subject: "Your Lucky Strike OTP",
    preview: "Use the code below to securely log in.",
    text: "Your OTP is: {otp}",
    heading: "Your secure login code",
    intro:
      "Use the verification code below to complete your sign-in. This code expires shortly for your protection.",
    actionLabel: "Use OTP",
    actionUrl: `${process.env.FRONTEND_URL || "https://luckystrike.app"}/login`,
    details: [{ label: "One-time password", value: "{otp}" }],
  },
  wallet_topup: {
    subject: "Lucky Strike wallet top-up",
    preview: "Your wallet top-up was successful.",
    text: "Your wallet was topped up successfully.",
    heading: "Wallet topped up",
    intro:
      "Your Lucky Strike wallet has been successfully credited and is ready for your next draw.",
    actionLabel: "Open wallet",
    actionUrl: `${process.env.FRONTEND_URL || "https://luckystrike.app"}/wallet`,
    details: [
      { label: "Status", value: "Successful" },
      { label: "Amount", value: "{amount}" },
    ],
  },
  general: {
    subject: "Lucky Strike update",
    preview: "This is a Lucky Strike update.",
    text: "This is a Lucky Strike update.",
    heading: "A quick update",
    intro:
      "We have an important update for you about your Lucky Strike account and draws.",
    actionLabel: "Learn more",
    actionUrl: `${process.env.FRONTEND_URL || "https://luckystrike.app"}`,
    details: [{ label: "Message", value: "{message}" }],
  },
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderTemplateString = (
  template: string,
  data: Record<string, string | number> = {},
): string =>
  Object.entries(data).reduce((result, [key, value]) => {
    const placeholder = new RegExp(`\\{${escapeRegExp(key)}\\}`, "g");
    return result.replace(placeholder, String(value));
  }, template);

const renderEmailHtml = (
  theme: EmailTheme,
  template: EmailTemplateConfig,
  data: Record<string, string | number> = {},
): string => {
  const renderedHeading = renderTemplateString(template.heading, data);
  const renderedIntro = renderTemplateString(template.intro, data);
  const renderedDetails = template.details
    .map((detail) => {
      const label = escapeHtml(renderTemplateString(detail.label, data));
      const value = escapeHtml(renderTemplateString(detail.value, data));
      return `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid ${theme.border};">
            <div style="font-size: 12px; color: ${theme.muted}; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">
              ${label}
            </div>
            <div style="font-size: 17px; color: ${theme.text}; font-weight: 700; margin-top: 4px;">
              ${value}
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const actionMarkup =
    template.actionLabel && template.actionUrl
      ? `
      <div style="text-align: center; margin-top: 24px; margin-bottom: 8px;">
        <a
          href="${escapeHtml(renderTemplateString(template.actionUrl, data))}"
          style="display: inline-block; background: ${theme.accent}; color: ${theme.buttonText}; text-decoration: none; padding: 14px 26px; border-radius: 999px; font-weight: 700; font-size: 14px;"
        >
          ${escapeHtml(renderTemplateString(template.actionLabel, data))}
        </a>
      </div>
    `
      : "";

  return `
    <div style="margin: 0; padding: 32px 16px; background: ${theme.background}; font-family: Arial, Helvetica, sans-serif; color: ${theme.text};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background: ${theme.panel}; border: 1px solid ${theme.border}; border-radius: 20px; overflow: hidden;">
        <tr>
          <td style="padding: 28px 28px 12px; background: linear-gradient(135deg, ${theme.accentSoft} 0%, ${theme.panel} 100%);">
            <table role="presentation" width="100%">
              <tr>
                <td>
                  <div style="display: inline-block; background: ${theme.accent}; color: ${theme.buttonText}; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 12px; border-radius: 999px;">
                    ${theme.name}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 28px 0;">
            <h1 style="margin: 0; font-size: 32px; line-height: 1.2; color: ${theme.accentStrong};">
              ${escapeHtml(renderedHeading)}
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 28px 0;">
            <p style="margin: 0; font-size: 16px; line-height: 1.7; color: ${theme.text};">
              ${escapeHtml(renderedIntro)}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px 28px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid ${theme.border}; border-radius: 16px; overflow: hidden; background: #ffffff;">
              ${renderedDetails}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 28px 28px;">
            ${actionMarkup}
            <p style="margin: 12px 0 0; font-size: 12px; line-height: 1.6; color: ${theme.muted}; text-align: center;">
              Thank you for playing Lucky Strike. Your trust keeps our draws fair and exciting.
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
};

export const sendEmail = async ({
  to,
  template,
  data,
}: {
  to: string;
  template: EmailTemplate;
  data?: Record<string, string | number>;
}): Promise<void> => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.warn("SMTP credentials missing. Skipping email send.");
    return;
  }

  const templateConfig = emailTemplates[template];
  const theme = emailThemes[template];
  const renderedSubject = renderTemplateString(
    templateConfig.subject,
    data || {},
  );
  const renderedText = renderTemplateString(templateConfig.text, data || {});
  const renderedHtml = renderEmailHtml(theme, templateConfig, data || {});

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: renderedSubject,
    text: renderedText,
    html: renderedHtml,
    headers: {
      "X-Mailer": "Lucky Strike",
      "X-Template": template,
    },
  });
};
