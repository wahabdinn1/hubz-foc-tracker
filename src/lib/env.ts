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
