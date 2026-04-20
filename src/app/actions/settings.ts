"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ccRecipients, type CCRecipient } from "@/db/schema";
import type { ActionResult } from "@/types/inventory";
import { timingSafeEqual } from "@/lib/crypto";
import { isRateLimited, recordFailedAttempt, clearAttempts, getRemainingAttempts, getRateLimitKey } from "@/lib/rate-limit";
import { sheets } from "@/features/inventory/actions/google";
import { sql } from "drizzle-orm";

const SETTINGS_COOKIE_NAME = "settings_unlocked";
const SETTINGS_COOKIE_MAX_AGE = 60 * 60;

export async function verifySettingsPin(pin: string): Promise<ActionResult> {
  const rateLimitKey = await getRateLimitKey("settings");

  if (await isRateLimited(rateLimitKey)) {
    return {
      success: false,
      error: "Too many failed attempts. Please try again in 15 minutes.",
    };
  }

  const rawPins = process.env.AUTHORIZED_PINS;
  if (!rawPins) {
    console.error("[SETTINGS] AUTHORIZED_PINS environment variable is not set");
    return {
      success: false,
      error: "Server misconfigured — please contact the administrator.",
    };
  }

  // Strip surrounding quotes that Vercel env dashboard may preserve
  const cleanedPins = rawPins.replace(/^["']|["']$/g, "");
  const authorizedPins = cleanedPins.split(",").filter(Boolean);
  try {
    const matched = authorizedPins.find((p) =>
      timingSafeEqual(p.trim(), pin)
    );

    if (matched === undefined) {
      await recordFailedAttempt(rateLimitKey);
      const remaining = await getRemainingAttempts(rateLimitKey);
      return {
        success: false,
        error: remaining > 0
          ? `Invalid PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please try again in 15 minutes.",
      };
    }

    await clearAttempts(rateLimitKey);

    const cookieStore = await cookies();
    cookieStore.set(SETTINGS_COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SETTINGS_COOKIE_MAX_AGE,
      path: "/",
    });

    // Force revalidation to clear PinScreen state
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("[SETTINGS] PIN Verification Error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function isSettingsUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(SETTINGS_COOKIE_NAME);
}

export interface SystemHealth {
  supabase: "healthy" | "unhealthy";
  googleSheets: "healthy" | "unhealthy";
  mailer: "healthy" | "unhealthy";
  lastChecked: string;
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    supabase: "unhealthy",
    googleSheets: "unhealthy",
    mailer: "unhealthy",
    lastChecked: new Date().toISOString(),
  };

  // Check Supabase
  try {
    await db.execute(sql`SELECT 1`);
    health.supabase = "healthy";
  } catch (error) {
    console.error("[HEALTH] Supabase connection failed:", error);
  }

  // Check Google Sheets
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (spreadsheetId) {
      await sheets.spreadsheets.get({ spreadsheetId });
      health.googleSheets = "healthy";
    }
  } catch (error) {
    console.error("[HEALTH] Google Sheets API failed:", error);
  }

  // Check Mailer Config
  const hasMailerEnv = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL);
  health.mailer = hasMailerEnv ? "healthy" : "unhealthy";

  return health;
}

export async function getCCRecipients(): Promise<CCRecipient[]> {
  try {
    return await db.select().from(ccRecipients).orderBy(ccRecipients.createdAt);
  } catch (error) {
    console.error("[SETTINGS] Failed to fetch CC recipients:", error);
    return [];
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function addCCRecipient(email: string): Promise<ActionResult<CCRecipient>> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { success: false, error: "Email address is required." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { success: false, error: "Invalid email format." };
  }

  try {
    const [created] = await db.insert(ccRecipients).values({ email: trimmed }).returning();
    return { success: true, data: created };
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "This email already exists in the CC list." };
    }
    console.error("[SETTINGS] Failed to add CC recipient:", error);
    return { success: false, error: "Failed to add email. Please try again." };
  }
}

export async function deleteCCRecipient(id: number): Promise<ActionResult> {
  try {
    const result = await db.delete(ccRecipients).where(eq(ccRecipients.id, id)).returning();
    if (result.length === 0) {
      return { success: false, error: "Email not found." };
    }
    return { success: true };
  } catch (error) {
    console.error("[SETTINGS] Failed to delete CC recipient:", error);
    return { success: false, error: "Failed to delete email. Please try again." };
  }
}

interface BulkAddResult {
  success: boolean;
  added: CCRecipient[];
  skipped: string[];
  error?: string;
}

export async function addMultipleCCRecipients(raw: string): Promise<BulkAddResult> {
  const emails = raw
    .split(/[,;\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0) {
    return { success: false, added: [], skipped: [], error: "No valid emails provided." };
  }

  const validEmails = emails.filter(e => EMAIL_REGEX.test(e));
  const skipped = emails.filter(e => !EMAIL_REGEX.test(e)).map(e => `${e} (invalid format)`);

  if (validEmails.length === 0) {
    return { success: false, added: [], skipped, error: "No valid emails provided." };
  }

  const added: CCRecipient[] = [];

  try {
    const inserted = await db.insert(ccRecipients)
      .values(validEmails.map(email => ({ email })))
      .onConflictDoNothing()
      .returning();

    added.push(...inserted);

    const insertedEmails = new Set(inserted.map(r => r.email));
    for (const email of validEmails) {
      if (!insertedEmails.has(email)) {
        skipped.push(`${email} (duplicate)`);
      }
    }
  } catch (error) {
    console.error("[SETTINGS] Failed to bulk add CC recipients:", error);
    for (const email of validEmails) {
      skipped.push(`${email} (error)`);
    }
  }

  return { success: true, added, skipped };
}

export async function updateCCRecipient(
  id: number,
  newEmail: string
): Promise<ActionResult<CCRecipient>> {
  const trimmed = newEmail.trim().toLowerCase();

  if (!trimmed) {
    return { success: false, error: "Email address is required." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { success: false, error: "Invalid email format." };
  }

  try {
    const [updated] = await db
      .update(ccRecipients)
      .set({ email: trimmed })
      .where(eq(ccRecipients.id, id))
      .returning();

    if (!updated) {
      return { success: false, error: "Email not found." };
    }
    return { success: true, data: updated };
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "This email already exists in the CC list." };
    }
    console.error("[SETTINGS] Failed to update CC recipient:", error);
    return { success: false, error: "Failed to update email. Please try again." };
  }
}

import { dropdownOptions, type DropdownOption } from "@/db/schema";


export async function getDropdownOptions(category?: string): Promise<DropdownOption[]> {
  try {
    if (category) {
      return await db.select().from(dropdownOptions).where(eq(dropdownOptions.category, category)).orderBy(dropdownOptions.value);
    }
    return await db.select().from(dropdownOptions).orderBy(dropdownOptions.category, dropdownOptions.value);
  } catch (error) {
    console.error("[SETTINGS] Failed to fetch dropdown options:", error);
    return [];
  }
}

export async function addDropdownOption(category: string, value: string): Promise<ActionResult<DropdownOption>> {
  const trimmedCategory = category.trim().toUpperCase();
  const trimmedValue = value.trim();

  if (!trimmedCategory || !trimmedValue) {
    return { success: false, error: "Category and value are required." };
  }

  try {
    const [created] = await db.insert(dropdownOptions).values({ 
      category: trimmedCategory, 
      value: trimmedValue 
    }).returning();
    return { success: true, data: created };
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "This option already exists in this category." };
    }
    console.error("[SETTINGS] Failed to add dropdown option:", error);
    return { success: false, error: "Failed to add option. Please try again." };
  }
}

export async function updateDropdownOption(
  id: number,
  updates: { value?: string; isActive?: boolean }
): Promise<ActionResult<DropdownOption>> {
  try {
    const toUpdate: { value?: string; isActive?: boolean } = {};
    if (updates.value !== undefined) {
      const trimmedValue = updates.value.trim();
      if (!trimmedValue) return { success: false, error: "Value cannot be empty." };
      toUpdate.value = trimmedValue;
    }
    if (updates.isActive !== undefined) {
      toUpdate.isActive = updates.isActive;
    }

    if (Object.keys(toUpdate).length === 0) {
      return { success: false, error: "No updates provided." };
    }

    const [updated] = await db
      .update(dropdownOptions)
      .set(toUpdate)
      .where(eq(dropdownOptions.id, id))
      .returning();

    if (!updated) {
      return { success: false, error: "Option not found." };
    }
    return { success: true, data: updated };
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { success: false, error: "This option already exists in this category." };
    }
    console.error("[SETTINGS] Failed to update dropdown option:", error);
    return { success: false, error: "Failed to update option. Please try again." };
  }
}

export async function deleteDropdownOption(id: number): Promise<ActionResult> {
  try {
    const result = await db.delete(dropdownOptions).where(eq(dropdownOptions.id, id)).returning();
    if (result.length === 0) {
      return { success: false, error: "Option not found." };
    }
    return { success: true };
  } catch (error) {
    console.error("[SETTINGS] Failed to delete dropdown option:", error);
    return { success: false, error: "Failed to delete option. Please try again." };
  }
}
