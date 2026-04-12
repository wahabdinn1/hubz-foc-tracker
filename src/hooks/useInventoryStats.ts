import { useMemo } from "react";
import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";
import { parse, isValid } from "date-fns";

export interface DashboardDateRange {
    from?: Date;
    to?: Date;
}

function parseDateStr(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "-") return null;
    
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    
    const formats = ["M/d/yyyy H:mm:ss", "M/d/yyyy", "yyyy-MM-dd"];
    for (const fmt of formats) {
        d = parse(dateStr, fmt, new Date());
        if (isValid(d)) return d;
    }
    return null;
}

export function useInventoryStats(inventory: InventoryItem[], dateRange?: DashboardDateRange) {
    return useMemo(() => {
        const validInventory = inventory.filter(item =>
            (item.imei && item.imei.trim() !== "") || (item.unitName && item.unitName.trim() !== "")
        );

        let availableCount = 0;
        let onKolCount = 0;
        let giftedUnitsCount = 0;
        const availableUnits: InventoryItem[] = [];
        const loanedItems: InventoryItem[] = [];

        for (const item of validInventory) {
            const statusUpper = item.statusLocation?.toUpperCase() || "";
            if (statusUpper.includes("AVAILABLE")) {
                availableCount++;
                availableUnits.push(item);
            }
            if (statusUpper.includes("LOANED") || statusUpper.includes("ON KOL")) {
                onKolCount++;
                loanedItems.push(item);
            }
            if (item.focStatus?.toUpperCase().trim() === "UNRETURN") {
                giftedUnitsCount++;
            }
        }

        const totalStock = validInventory.length;

        const itemsToReturnRaw = inventory.filter(item => {
            const locationStr = item.statusLocation?.toUpperCase() || "";
            if (locationStr.includes('RETURN TO TCC')) return false;
            const hasReturnDate = item.plannedReturnDate && item.plannedReturnDate.trim() !== "" && item.plannedReturnDate.toUpperCase() !== "N/A";
            
            if (!hasReturnDate) return false;
            
            if (dateRange?.from || dateRange?.to) {
                const returnDate = parseDateStr(item.plannedReturnDate);
                if (returnDate) {
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

        const topUrgentReturns = Array.from(aggregatedReturnsMap.values()).sort((a, b) => {
            const aIsAsap = a.plannedReturnDate?.toUpperCase() === 'ASAP';
            const bIsAsap = b.plannedReturnDate?.toUpperCase() === 'ASAP';
            if (aIsAsap && !bIsAsap) return -1;
            if (!aIsAsap && bIsAsap) return 1;
            if (aIsAsap && bIsAsap) return 0;
            const dateA = parseDateStr(a.plannedReturnDate);
            const dateB = parseDateStr(b.plannedReturnDate);
            const timeA = dateA ? dateA.getTime() : 0;
            const timeB = dateB ? dateB.getTime() : 0;
            return timeA - timeB;
        });

        const pendingReturnCount = topUrgentReturns.length;

        const recentActivity = [...validInventory].filter(item => {
            const dateStr = item.fullData?.["Timestamp"] || item.fullData?.["Date Received"] || item.fullData?.["Request Date"];
            if (!dateStr || dateStr.trim() === "" || dateStr.trim() === "-") return false;
            
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
            const dateA = parseDateStr(a.fullData?.["Timestamp"] || a.fullData?.["Date Received"] || a.fullData?.["Request Date"]);
            const dateB = parseDateStr(b.fullData?.["Timestamp"] || b.fullData?.["Date Received"] || b.fullData?.["Request Date"]);
            const timeA = dateA ? dateA.getTime() : 0;
            const timeB = dateB ? dateB.getTime() : 0;
            return timeB - timeA;
        }).slice(0, 15);

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
    }, [inventory, dateRange]);
}
