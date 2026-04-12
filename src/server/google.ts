import { google } from "googleapis";

// ── Startup Validation ─────────────────────────────────────────────
// Fail fast with a clear message instead of cryptic runtime errors.
const REQUIRED_ENV = [
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_SHEET_ID",
    "JWT_SECRET",
    "AUTHORIZED_PINS",
] as const;

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
    throw new Error(
        `[FOC Tracker] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
        `Add them to .env.local and restart the server.`
    );
}

// ── Google Sheets Client ────────────────────────────────────────────
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
});

export const sheets = google.sheets({ version: "v4", auth });
