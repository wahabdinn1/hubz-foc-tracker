import { google } from "googleapis";

const missing = [
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_SHEET_ID",
].filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `[FOC Tracker] Missing required environment variables:\n  ${missing.join("\n  ")}\n` +
    `Add them to .env.local and restart the server.`
  );
}

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: SCOPES,
});

export const sheets = google.sheets({ version: "v4", auth });
