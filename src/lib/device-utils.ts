import { DEVICE_CATEGORIES, FOC_TYPE_KEYS } from "@/lib/constants";
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
    if (!item.fullData) return "";
    for (const key of FOC_TYPE_KEYS) {
        const val = item.fullData[key];
        if (val && val.trim() !== "" && val.trim() !== "-") return val.trim().toUpperCase();
    }
    return "";
}
