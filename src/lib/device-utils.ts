import { DEVICE_CATEGORIES } from "@/lib/constants";
import type { InventoryItem } from "@/types/inventory";

export function getDeviceCategory(unitName: string): string {
    const upper = unitName.toUpperCase().trim();
    for (const cat of DEVICE_CATEGORIES) {
        if (upper.startsWith(cat.prefix)) return cat.label;
    }
    return "Others";
}

export function getCategoryIcon(name: string): string {
    const cat = DEVICE_CATEGORIES.find(c => c.label === name);
    return cat?.icon || "📦";
}

export function extractFocType(item: InventoryItem): string {
    const raw = item.step3Data?.typeOfFoc || item.step1Data?.focType || "";
    if (raw && raw.trim() !== "" && raw.trim() !== "-") return raw.trim().toUpperCase();
    return "";
}
