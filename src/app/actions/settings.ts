"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ccRecipients, type CCRecipient } from "@/db/schema";
import type { ActionResult } from "@/types/inventory";

const SETTINGS_COOKIE_NAME = "settings_unlocked";
const SETTINGS_COOKIE_MAX_AGE = 60 * 60;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = new TextEncoder().encode(a);
  const bBuf = new TextEncoder().encode(b);
  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

export async function verifySettingsPin(pin: string): Promise<ActionResult> {
  const authorizedPins = process.env.AUTHORIZED_PINS?.split(",") || [];
  const matched = authorizedPins.find((p) =>
    timingSafeEqual(p.trim(), pin)
  );

  if (matched === undefined) {
    return { success: false, error: "Invalid PIN. Access denied." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SETTINGS_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SETTINGS_COOKIE_MAX_AGE,
    path: "/",
  });

  return { success: true };
}

export async function isSettingsUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(SETTINGS_COOKIE_NAME);
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

export async function addCCRecipient(email: string): Promise<ActionResult & { data?: CCRecipient }> {
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

  const added: CCRecipient[] = [];
  const skipped: string[] = [];

  for (const email of emails) {
    if (!EMAIL_REGEX.test(email)) {
      skipped.push(`${email} (invalid format)`);
      continue;
    }

    try {
      const [created] = await db.insert(ccRecipients).values({ email }).returning();
      added.push(created);
    } catch (error: unknown) {
      const pgError = error as { code?: string };
      if (pgError.code === "23505") {
        skipped.push(`${email} (duplicate)`);
      } else {
        skipped.push(`${email} (error)`);
        console.error("[SETTINGS] Failed to add CC recipient:", email, error);
      }
    }
  }

  return { success: true, added, skipped };
}

export async function updateCCRecipient(
  id: number,
  newEmail: string
): Promise<ActionResult & { data?: CCRecipient }> {
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
