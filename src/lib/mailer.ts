import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

type ActionLabel = "REQUEST" | "RETURN" | "TRANSFER";

interface FocNotificationData {
  actionType: ActionLabel;
  unitName: string;
  imei: string;
  kolName: string;
  requestor: string;
  email: string;
  timestamp: string;
  additionalData?: Record<string, string>;
}

const EMAIL_SUBJECT = "\u{1F4F1} FOC Tracker Log - System Notifications";
const THREAD_ID = "<foc-tracker-main-thread@wppmedia.com>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDisplayDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const day = parts.find((p) => p.type === "day")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const year = parts.find((p) => p.type === "year")?.value || "";
  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "";

  return `${day} ${month} ${year} · ${hour}:${minute}`;
}

function getActionStyle(action: ActionLabel): { bg: string; color: string; label: string } {
  switch (action) {
    case "REQUEST":
      return { bg: "#eff6ff", color: "#1d4ed8", label: "OUTBOUND REQUEST" };
    case "RETURN":
      return { bg: "#f0fdf4", color: "#15803d", label: "INBOUND RETURN" };
    case "TRANSFER":
      return { bg: "#fefce8", color: "#a16207", label: "DIRECT TRANSFER" };
  }
}

function buildItemCard(data: FocNotificationData): string {
  const style = getActionStyle(data.actionType);
  const dateStr = formatDisplayDate();

  const extraRows = data.additionalData
    ? Object.entries(data.additionalData)
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">${escapeHtml(label)}</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(value)}</td>
        </tr>`
        )
        .join("")
    : "";

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
    <tr>
      <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 24px 24px 16px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">FOC Tracker Log</h2>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">${escapeHtml(dateStr)} &middot; WPP Media FOC System</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <span style="display: inline-block; background-color: ${style.bg}; color: ${style.color}; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; padding: 5px 12px; border-radius: 6px; text-transform: uppercase;">${style.label}</span>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="height: 1px; background-color: #f1f5f9;"></td></tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">Unit Name</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(data.unitName)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">IMEI / Serial</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;">${escapeHtml(data.imei)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">KOL</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(data.kolName)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">Requestor</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(data.requestor)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">Email</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600;">${escapeHtml(data.email)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 40%; vertical-align: top;">Timestamp</td>
            <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; font-weight: 600; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;">${escapeHtml(data.timestamp)}</td>
          </tr>
          ${extraRows}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; text-align: center;">This is an automated notification from the WPP Media FOC Tracker System.</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>`;
}

function buildBatchHtml(items: FocNotificationData[]): string {
  const cards = items.map((item) => buildItemCard(item)).join("\n");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              ${cards}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSingleHtml(data: FocNotificationData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td>
              ${buildItemCard(data)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

let ccCache: { emails: string; expiresAt: number } | null = null;
const CC_CACHE_TTL = 30_000;

async function resolveCCField(): Promise<string> {
  const now = Date.now();
  if (ccCache && ccCache.expiresAt > now) {
    return ccCache.emails;
  }

  try {
    const { db } = await import("@/db");
    const { ccRecipients } = await import("@/db/schema");
    const rows = await db.select({ email: ccRecipients.email }).from(ccRecipients);
    if (rows.length > 0) {
      const emails = rows.map((r) => r.email).join(",");
      ccCache = { emails, expiresAt: now + CC_CACHE_TTL };
      return emails;
    }
  } catch (error) {
    console.warn("[MAILER] Failed to fetch CC recipients from database, falling back to CC_EMAILS env:", error);
  }

  const fallback = process.env.CC_EMAILS?.trim() || "";
  if (fallback) {
    console.warn("[MAILER] Using CC_EMAILS fallback from environment.");
  }
  ccCache = { emails: fallback, expiresAt: now + CC_CACHE_TTL };
  return fallback;
}

async function sendMail(html: string): Promise<void> {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!emailUser || !emailPass || !adminEmail) {
    console.warn("[MAILER] Email notification skipped — EMAIL_USER, EMAIL_PASS, or ADMIN_EMAIL not configured.");
    return;
  }

  const ccEmails = await resolveCCField();

  const messageId = `<${Date.now()}-${Math.random().toString(36).substring(2)}@wppmedia.com>`;

  try {
    await transporter.sendMail({
      from: `"WPP Media FOC System" <${emailUser}>`,
      to: adminEmail,
      ...(ccEmails && { cc: ccEmails }),
      subject: EMAIL_SUBJECT,
      html,
      messageId,
      inReplyTo: THREAD_ID,
      references: [THREAD_ID],
    });
  } catch (error) {
    console.error("[MAILER] Failed to send email notification:", error);
  }
}

export async function sendFocNotification(data: FocNotificationData): Promise<void> {
  await sendMail(buildSingleHtml(data));
}

export async function sendFocBatchNotification(items: FocNotificationData[]): Promise<void> {
  await sendMail(buildBatchHtml(items));
}
