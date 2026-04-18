"use client"


export function hasFilledFields(formValues: Record<string, unknown>, excludeKeys: string[] = []): boolean {
    for (const [key, value] of Object.entries(formValues)) {
        if (excludeKeys.includes(key)) continue
        if (value === null || value === undefined) continue
        if (typeof value === "string" && value.trim() !== "") return true
        if (value instanceof Date) return true
        if (Array.isArray(value) && value.length > 0) {
            for (const item of value) {
                if (typeof item === "object" && item !== null) {
                    if (hasFilledFields(item as Record<string, unknown>)) return true
                }
            }
        }
    }
    return false
}
