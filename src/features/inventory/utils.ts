import { DEVICE_CATEGORIES } from "@/lib/constants";
import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";
import { isItemOverdue } from "@/lib/date-utils";

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
    const raw = item.step3Data?.typeOfFoc || item.focType || "";
    if (raw && raw.trim() !== "" && raw.trim() !== "-") return raw.trim().toUpperCase();
    return "";
}

/** Progress bar result for return tracking urgency visualization */
export interface UrgencyProgress {
    percent: number;
    color: string;
}

/**
 * Calculate urgency progress for a return tracking item.
 * Returns progress percentage (0-100) and corresponding Tailwind color class.
 */
export function calculateUrgencyProgress(item: ReturnTrackingItem): UrgencyProgress {
    const isAsap = item.plannedReturnDate?.toUpperCase() === 'ASAP';
    const overdue = isItemOverdue(item);

    if (isAsap || overdue) {
        return { percent: 100, color: "bg-red-500" };
    }

    if (!item.plannedReturnDate) {
        return { percent: 0, color: "bg-neutral-500" };
    }

    const urgency = (() => {
        const d = new Date(item.plannedReturnDate);
        if (isNaN(d.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    })();

    if (urgency === null) {
        return { percent: 0, color: "bg-neutral-500" };
    }

    if (urgency > 14) return { percent: 20, color: "bg-green-500" };
    if (urgency > 7) return { percent: 50, color: "bg-blue-500" };
    if (urgency > 3) return { percent: 80, color: "bg-orange-500" };
    return { percent: 95, color: "bg-red-400" };
}
