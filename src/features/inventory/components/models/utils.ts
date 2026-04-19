/**
 * Extract the base device model from a full unit name.
 * "G-S25-EDGE 256GB SILVER" → "S25-EDGE"
 * "G-A07 RAMADHAN PACKAGE"  → "A07"
 * "G-BUDS4-PRO GOLD (2026)" → "BUDS4-PRO"
 */
export function extractBaseModel(unitName: string): string {
    const cleaned = unitName.trim().toUpperCase();
    const withoutPrefix = cleaned.startsWith("G-") ? cleaned.slice(2) : cleaned;
    return withoutPrefix.split(/\s+/)[0] || withoutPrefix;
}

export function getModelIcon(model: string): string {
    const m = model.toUpperCase();
    if (m.startsWith("TAB")) return "📋";
    if (m.startsWith("BUDS")) return "🎧";
    if (m.startsWith("WATCH")) return "⌚";
    return "📱";
}
