import { parse, isValid } from "date-fns";
import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";
import { isStatusAvailable, isStatusLoaned, isStatusReturnToTcc } from "@/lib/constants";

export interface DashboardDateRange {
    from?: string; // ISO strings for serialization
    to?: string;
}

export interface DashboardData {
    totalStock: number;
    availableCount: number;
    onKolCount: number;
    giftedUnitsCount: number;
    pendingReturnCount: number;
    topUrgentReturns: ReturnTrackingItem[];
    recentActivity: InventoryItem[];
    availableUnits: InventoryItem[];
    loanedItems: InventoryItem[];
    allInventory: InventoryItem[];
}

function parseDateStr(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "-") return null;
    
    const formats = ["M/d/yyyy H:mm:ss", "M/d/yyyy", "yyyy-MM-dd"];
    for (const fmt of formats) {
        const d = parse(dateStr, fmt, new Date(0));
        if (isValid(d)) {
            return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        }
    }
    
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) {
        return new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
    }
    return null;
}

export function aggregateDashboardData(inventory: InventoryItem[], dateRange?: DashboardDateRange): DashboardData {
    const validInventory = inventory.filter(item =>
        (item.imei && item.imei.trim() !== "") || (item.unitName && item.unitName.trim() !== "")
    );

    let availableCount = 0;
    let onKolCount = 0;
    let giftedUnitsCount = 0;

    for (const item of validInventory) {
        if (isStatusAvailable(item.statusLocation)) {
            availableCount++;
        }
        if (isStatusLoaned(item.statusLocation)) {
            onKolCount++;
        }
        if (item.focStatus?.toUpperCase().trim() === "UNRETURN") {
            giftedUnitsCount++;
        }
    }

    const totalStock = validInventory.length;
    const aggregatedReturnsMap = new Map<string, ReturnTrackingItem>();

    for (const item of inventory) {
        if (isStatusReturnToTcc(item.statusLocation)) continue;
        const tccReceipt = item.returnToTccReceipt?.trim();
        if (tccReceipt && tccReceipt !== "" && tccReceipt !== "-") continue;
        
        const hasReturnDate = item.plannedReturnDate && item.plannedReturnDate.trim() !== "" && item.plannedReturnDate.toUpperCase() !== "N/A";
        if (!hasReturnDate) continue;

        if (dateRange?.from || dateRange?.to) {
            const returnDate = parseDateStr(item.plannedReturnDate);
            if (returnDate) {
                returnDate.setHours(0,0,0,0);
                if (dateRange.from) {
                    const fromD = new Date(dateRange.from);
                    fromD.setHours(0,0,0,0);
                    if (returnDate < fromD) continue;
                }
                if (dateRange.to) {
                    const toD = new Date(dateRange.to);
                    toD.setHours(23,59,59,999);
                    if (returnDate > toD) continue;
                }
            }
        }

        const unitName = item.unitName?.trim() || "Unknown Unit";
        const seinPic = item.seinPic?.trim() || "-";
        const goatPic = item.goatPic?.trim() || "-";
        const key = `${unitName}_${seinPic}_${goatPic}`;

        if (aggregatedReturnsMap.has(key)) {
            const existing = aggregatedReturnsMap.get(key)!;
            existing.groupCount += 1;
            if (item.plannedReturnDate?.toUpperCase() === 'ASAP' && existing.plannedReturnDate?.toUpperCase() !== 'ASAP') {
                existing.plannedReturnDate = 'ASAP';
            }
        } else {
            aggregatedReturnsMap.set(key, { ...item, groupCount: 1 });
        }
    }

    const topUrgentReturns = Array.from(aggregatedReturnsMap.values()).sort((a, b) => {
        const aIsAsap = a.plannedReturnDate?.toUpperCase() === 'ASAP';
        const bIsAsap = b.plannedReturnDate?.toUpperCase() === 'ASAP';
        if (aIsAsap && !bIsAsap) return -1;
        if (!aIsAsap && bIsAsap) return 1;
        const dateA = parseDateStr(a.plannedReturnDate);
        const dateB = parseDateStr(b.plannedReturnDate);
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });

    const pendingReturnCount = topUrgentReturns.length;

    const recentActivity = [...validInventory].filter(item => {
        const dateStr = item.step3Data?.timestamp || item.dateOfReceipt;
        if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "-") return false;
        
        if (dateRange?.from || dateRange?.to) {
            const parsedDate = parseDateStr(dateStr);
            if (parsedDate) {
                if (dateRange.from && parsedDate < new Date(dateRange.from)) return false;
                if (dateRange.to && parsedDate > new Date(dateRange.to)) return false;
            }
        }
        return true;
    }).sort((a, b) => {
        const dateA = parseDateStr(a.step3Data?.timestamp || a.dateOfReceipt);
        const dateB = parseDateStr(b.step3Data?.timestamp || b.dateOfReceipt);
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    }).slice(0, 15);

    // Collect available and loaned items
    const availableUnits = validInventory.filter(item => isStatusAvailable(item.statusLocation));
    const loanedItems = validInventory.filter(item => isStatusLoaned(item.statusLocation));

    return {
        totalStock,
        availableCount,
        onKolCount,
        giftedUnitsCount,
        pendingReturnCount,
        topUrgentReturns,
        recentActivity,
        availableUnits,
        loanedItems,
        allInventory: validInventory
    };
}
