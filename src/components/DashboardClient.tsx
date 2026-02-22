"use client";

import { useState, useTransition } from "react";
import { InventoryItem, requestUnit, revalidateInventory } from "@/server/actions";
import { Scorecard } from "./Scorecard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RequestFormModal } from "./RequestFormModal";
import { ReturnFormModal } from "./ReturnFormModal";
import { ThemeToggle } from "./ThemeToggle";
import { QuickViewPanel } from "./QuickViewPanel";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ReturnTrackingTable } from "./dashboard/ReturnTrackingTable";
import { ActivityFeed } from "./dashboard/ActivityFeed";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Package, CheckCircle, Clock, Gift, RefreshCw,
    Smartphone, ArrowDownRight, ArrowUpRight, History, Calendar as CalendarIcon
} from "lucide-react";

export function DashboardClient({ inventory, isAuthenticated }: { inventory: InventoryItem[], isAuthenticated: boolean }) {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    // Sync State
    const [isPending, startTransition] = useTransition();

    const handleSync = () => {
        startTransition(async () => {
            const res = await revalidateInventory();
            if (res.success) {
                toast.success("Inventory synchronized with Google Sheets");
            } else {
                toast.error("Failed to sync inventory");
            }
        });
    };

    const validInventory = inventory.filter(item => (item.imei && item.imei.trim() !== "") || (item.unitName && item.unitName.trim() !== ""));
    const totalStock = validInventory.length;
    // Fallbacks applied in case location isn't exact
    const availableCount = validInventory.filter(i => i.statusLocation?.toUpperCase().includes("AVAILABLE")).length;
    const onKolCount = validInventory.filter(i => i.statusLocation?.toUpperCase().includes("LOANED")).length;

    const itemsToReturnRaw = inventory.filter(item => {
        const locationStr = item.statusLocation?.toUpperCase() || "";
        if (locationStr.includes('RETURN TO TCC')) return false;

        const hasReturnDate = item.plannedReturnDate && item.plannedReturnDate.trim() !== "" && item.plannedReturnDate.toUpperCase() !== "N/A";

        return hasReturnDate;
    });

    // Aggregate Returns by Unit Name, SEIN PIC, and GOAT PIC
    const aggregatedReturnsMap = new Map<string, InventoryItem & { groupCount: number }>();

    itemsToReturnRaw.forEach(item => {
        // Build a unique key for grouping
        const unitName = item.unitName?.trim() || "Unknown Unit";
        const seinPic = item.seinPic?.trim() || "-";
        const goatPic = item.goatPic?.trim() || "-";
        const key = `${unitName}_${seinPic}_${goatPic}`;

        if (aggregatedReturnsMap.has(key)) {
            const existing = aggregatedReturnsMap.get(key)!;
            existing.groupCount += 1;
            // Prefer ASAP dates for the group display if any exist within the group
            if (item.plannedReturnDate?.toUpperCase() === 'ASAP' && existing.plannedReturnDate?.toUpperCase() !== 'ASAP') {
                existing.plannedReturnDate = 'ASAP';
            }
        } else {
            aggregatedReturnsMap.set(key, { ...item, groupCount: 1 });
        }
    });

    const itemsToReturn = Array.from(aggregatedReturnsMap.values());

    const sortedUrgentReturns = itemsToReturn.sort((a, b) => {
        const aIsAsap = a.plannedReturnDate?.toUpperCase() === 'ASAP';
        const bIsAsap = b.plannedReturnDate?.toUpperCase() === 'ASAP';
        if (aIsAsap && !bIsAsap) return -1;
        if (!aIsAsap && bIsAsap) return 1;
        if (aIsAsap && bIsAsap) return 0;

        const dateA = new Date(a.plannedReturnDate).getTime();
        const dateB = new Date(b.plannedReturnDate).getTime();
        return dateA - dateB;
    });

    // Show all items to return or a high limit since it's a scrollable dedicated section
    const topUrgentReturns = sortedUrgentReturns;

    const availableUnits = inventory.filter(i => i.statusLocation?.includes("AVAILABLE"));
    const loanedItems = inventory.filter(i => i.statusLocation?.includes("LOANED") || i.statusLocation?.includes("ON KOL"));

    const giftedUnitsCount = inventory.filter(i => i.focStatus?.toUpperCase().trim() === 'UNRETURN').length;
    const pendingReturnCount = itemsToReturn.length;

    // Build Activity Feed by parsing Date fields
    // Sort all items globally by Request Date/Timestamp descending
    const recentActivity = [...validInventory].filter(item => {
        const dateStr = item.fullData?.["Timestamp"] || item.fullData?.["Date Received"] || item.fullData?.["Request Date"];
        return !!dateStr && dateStr.trim() !== "" && dateStr.trim() !== "-";
    }).sort((a, b) => {
        const dateA = new Date(a.fullData?.["Timestamp"] || a.fullData?.["Date Received"] || a.fullData?.["Request Date"] || 0);
        const dateB = new Date(b.fullData?.["Timestamp"] || b.fullData?.["Date Received"] || b.fullData?.["Request Date"] || 0);
        return dateB.getTime() - dateA.getTime();
    }).slice(0, 15);

    return (
        <div className="w-full h-full space-y-6 md:space-y-8 pb-10 p-4 md:p-10">
            {!isAuthenticated && (
                <div className="fixed inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-sm pointer-events-none transition-colors" />
            )}

            {/* Page Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors">
                        Inventory Overview
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 transition-colors">Real-time status of all FOC devices</p>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-white/80 dark:bg-neutral-900/40 p-1 md:p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-xl transition-colors">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSync}
                        disabled={isPending}
                        className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                        title="Force Sync with Google Sheets"
                    >
                        <RefreshCw className={cn("w-5 h-5", isPending && "animate-spin text-blue-500 dark:text-blue-400")} />
                    </Button>
                    <div className="w-px h-6 bg-black/10 dark:bg-white/10 transition-colors" />
                    <ReturnFormModal loanedItems={loanedItems} />
                    <RequestFormModal availableItems={availableUnits} />
                </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 relative z-10">
                <Scorecard title="Total Stock" value={totalStock} icon={<Package className="w-4 h-4" />} />
                <Scorecard title="Available" value={availableCount} icon={<CheckCircle className="w-4 h-4 text-green-400" />} />
                <Scorecard title="On KOL" value={onKolCount} icon={<Clock className="w-4 h-4 text-orange-400" />} />
                <Scorecard title="Unreturn" value={giftedUnitsCount} icon={<Gift className="w-4 h-4 text-cyan-400" />} subtitle="Marked as UNRETURN" />
                <Scorecard title="Pending Returns" value={pendingReturnCount} icon={<ArrowDownRight className="w-4 h-4 text-red-400" />} subtitle="Scheduled items" />
            </div>

            {/* Dashboard Analytics Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
                <ReturnTrackingTable
                    topUrgentReturns={topUrgentReturns}
                    setSelectedItem={setSelectedItem}
                />
                <ActivityFeed
                    recentActivity={recentActivity}
                />
            </div>

            <QuickViewPanel
                item={selectedItem}
                isOpen={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
