"use client"

import { useEffect } from "react"
import { UseFormReturn, FieldValues } from "react-hook-form"

interface PersistenceData<T extends FieldValues> {
  values: T
  timestamp: number
}

function reviveDates(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj

  const newObj = Array.isArray(obj) ? [...obj] : { ...(obj as Record<string, unknown>) }
  
  for (const key in newObj) {
    const value = (newObj as Record<string, unknown>)[key]
    // Check for ISO date string
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        (newObj as Record<string, unknown>)[key] = date
      }
    } else if (typeof value === "object") {
      (newObj as Record<string, unknown>)[key] = reviveDates(value)
    }
  }
  return newObj
}

/**
 * Persists form data to localStorage with an expiration time.
 * 
 * @param key Unique key for the form
 * @param form React Hook Form instance
 * @param enabled Whether persistence is enabled
 * @param expiryMs Time in milliseconds before the draft expires (default 1 minute)
 */
export function useFormPersistence<T extends FieldValues>(
  key: string,
  form: UseFormReturn<T>,
  enabled: boolean = true,
  expiryMs: number = 60000 // 1 minute
) {
  const storageKey = `form-draft-${key}`

  // Load draft on mount
  useEffect(() => {
    if (!enabled) return

    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const { values, timestamp }: PersistenceData<T> = JSON.parse(saved)
        const age = Date.now() - timestamp

        if (age < expiryMs) {
          const revived = reviveDates(values)
          form.reset(revived as T)
        } else {
          localStorage.removeItem(storageKey)
        }
      } catch (e) {
        console.error("Failed to load form draft:", e)
      }
    }
  }, [enabled, key, form, storageKey, expiryMs])

  // Save draft on change
  useEffect(() => {
    if (!enabled) return

    const subscription = form.watch((values) => {
      if (values && Object.keys(values).length > 0) {
        const data: PersistenceData<T> = {
          values: values as T,
          timestamp: Date.now(),
        }
        localStorage.setItem(storageKey, JSON.stringify(data))
      }
    })

    return () => subscription.unsubscribe()
  }, [enabled, form, storageKey])

  const clearDraft = () => {
    localStorage.removeItem(storageKey)
  }

  return { clearDraft }
}
