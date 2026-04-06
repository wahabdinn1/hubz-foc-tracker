import { useMemo } from "react";
import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";

export function useInventoryStats(inventory: InventoryItem[]) {
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
            return hasReturnDate;
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
    }, [inventory]);

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
            return !!dateStr && dateStr.trim() !== "" && dateStr.trim() !== "-";
        }).sort((a, b) => {
            const dateA = new Date(a.fullData?.["Timestamp"] || a.fullData?.["Date Received"] || a.fullData?.["Request Date"] || 0);
            const dateB = new Date(b.fullData?.["Timestamp"] || b.fullData?.["Date Received"] || b.fullData?.["Request Date"] || 0);
            return dateB.getTime() - dateA.getTime();
        }).slice(0, 15)
    , [validInventory]);

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
