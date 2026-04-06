import { useMemo } from "react";
import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";
import { parse, isValid } from "date-fns";

export interface DashboardDateRange {
    from?: Date;
    to?: Date;
}

function parseDateStr(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "-") return null;
    
    // Attempt standard JS parse first
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    // Common GS formats fallback
    const formats = ["M/d/yyyy H:mm:ss", "M/d/yyyy", "yyyy-MM-dd"];
    for (const fmt of formats) {
        d = parse(dateStr, fmt, new Date());
        if (isValid(d)) return d;
    }
    return null;
}

export function useInventoryStats(inventory: InventoryItem[], dateRange?: DashboardDateRange) {
    const validInventory = useMemo(() =>
        inventory.filter(item => (item.imei && item.imei.trim() !== "") || (item.unitName && item.unitName.trim() !== ""))
    , [inventory]);

    const totalStock = validInventory.length;

    const availableCount = useMemo(() =>
        validInventory.filter(i => i.statusLocation?.toUpperCase().includes("AVAILABLE")).length
    , [validInventory]);

    const onKolCount = useMemo(() =>
        validInventory.filter(i => i.statusLocation?.toUpperCase().includes("LOANED")).length
    , [validInventory]);

    const giftedUnitsCount = useMemo(() =>
        inventory.filter(i => i.focStatus?.toUpperCase().trim() === 'UNRETURN').length
    , [inventory]);

    const topUrgentReturns = useMemo((): ReturnTrackingItem[] => {
        const itemsToReturnRaw = inventory.filter(item => {
            const locationStr = item.statusLocation?.toUpperCase() || "";
            if (locationStr.includes('RETURN TO TCC')) return false;
            const hasReturnDate = item.plannedReturnDate && item.plannedReturnDate.trim() !== "" && item.plannedReturnDate.toUpperCase() !== "N/A";
            
            if (!hasReturnDate) return false;
            
            // Check against date filter
            if (dateRange?.from || dateRange?.to) {
                const returnDate = parseDateStr(item.plannedReturnDate);
                if (returnDate) {
                    // Set hours to 0 to compare purely by day
                    returnDate.setHours(0,0,0,0);
                    if (dateRange.from) {
                        const fromD = new Date(dateRange.from);
                        fromD.setHours(0,0,0,0);
                        if (returnDate < fromD) return false;
                    }
                    if (dateRange.to) {
                        const toD = new Date(dateRange.to);
                        toD.setHours(23,59,59,999);
                        if (returnDate > toD) return false;
                    }
                }
            }

            return true;
        });

        // Aggregate Returns by Unit Name, SEIN PIC, and GOAT PIC
        const aggregatedReturnsMap = new Map<string, ReturnTrackingItem>();

        itemsToReturnRaw.forEach(item => {
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
        });

        return Array.from(aggregatedReturnsMap.values()).sort((a, b) => {
            const aIsAsap = a.plannedReturnDate?.toUpperCase() === 'ASAP';
            const bIsAsap = b.plannedReturnDate?.toUpperCase() === 'ASAP';
            if (aIsAsap && !bIsAsap) return -1;
            if (!aIsAsap && bIsAsap) return 1;
            if (aIsAsap && bIsAsap) return 0;
            const dateA = new Date(a.plannedReturnDate).getTime();
            const dateB = new Date(b.plannedReturnDate).getTime();
            return dateA - dateB;
        });
    }, [inventory, dateRange]);

    const pendingReturnCount = topUrgentReturns.length;

    const availableUnits = useMemo(() =>
        inventory.filter(i => i.statusLocation?.includes("AVAILABLE"))
    , [inventory]);

    const loanedItems = useMemo(() =>
        inventory.filter(i => i.statusLocation?.includes("LOANED") || i.statusLocation?.includes("ON KOL"))
    , [inventory]);

    const recentActivity = useMemo(() =>
        [...validInventory].filter(item => {
            const dateStr = item.fullData?.["Timestamp"] || item.fullData?.["Date Received"] || item.fullData?.["Request Date"];
            if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "-") return false;
            
            // Check against date filter
            if (dateRange?.from || dateRange?.to) {
                const parsedDate = parseDateStr(dateStr);
                if (parsedDate) {
                    if (dateRange.from) {
                        const fromD = new Date(dateRange.from);
                        fromD.setHours(0,0,0,0);
                        if (parsedDate < fromD) return false;
                    }
                    if (dateRange.to) {
                        const toD = new Date(dateRange.to);
                        toD.setHours(23,59,59,999);
                        if (parsedDate > toD) return false;
                    }
                }
            }
            
            return true;
        }).sort((a, b) => {
            const dateA = new Date(a.fullData?.["Timestamp"] || a.fullData?.["Date Received"] || a.fullData?.["Request Date"] || 0);
            const dateB = new Date(b.fullData?.["Timestamp"] || b.fullData?.["Date Received"] || b.fullData?.["Request Date"] || 0);
            return dateB.getTime() - dateA.getTime();
        }).slice(0, 15)
    , [validInventory, dateRange]);

    return {
        totalStock,
        availableCount,
        onKolCount,
        giftedUnitsCount,
        pendingReturnCount,
        topUrgentReturns,
        availableUnits,
        loanedItems,
        recentActivity
    };
}
