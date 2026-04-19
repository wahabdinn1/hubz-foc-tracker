import { useMemo } from "react";
import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";
import { parse, isValid } from "date-fns";
import { isStatusAvailable, isStatusLoaned, isStatusReturnToTcc } from "@/lib/constants";

export interface DashboardDateRange {
    from?: Date;
    to?: Date;
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
            if (isStatusAvailable(item.statusLocation)) {
                availableCount++;
                availableUnits.push(item);
            }
            if (isStatusLoaned(item.statusLocation)) {
                onKolCount++;
                loanedItems.push(item);
            }
            if (item.focStatus?.toUpperCase().trim() === "UNRETURN") {
                giftedUnitsCount++;
            }
        }

        const totalStock = validInventory.length;

        const aggregatedReturnsMap = new Map<string, ReturnTrackingItem>();

        for (const item of inventory) {
            if (isStatusReturnToTcc(item.statusLocation)) continue;
            // Also exclude items that have a RETURN TO TCC receipt (Column L is filled)
            const tccReceipt = item.step1Data?.returnToTccReceipt?.trim();
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
            if (aIsAsap && bIsAsap) return 0;
            const dateA = parseDateStr(a.plannedReturnDate);
            const dateB = parseDateStr(b.plannedReturnDate);
            const timeA = dateA ? dateA.getTime() : 0;
            const timeB = dateB ? dateB.getTime() : 0;
            return timeA - timeB;
        });

        const pendingReturnCount = topUrgentReturns.length;

        const recentActivity = [...validInventory].filter(item => {
            const dateStr = item.step3Data?.timestamp || item.step1Data?.dateOfReceipt;
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
            const dateA = parseDateStr(a.step3Data?.timestamp || a.step1Data?.dateOfReceipt);
            const dateB = parseDateStr(b.step3Data?.timestamp || b.step1Data?.dateOfReceipt);
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
