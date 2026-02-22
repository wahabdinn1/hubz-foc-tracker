"use client";

import { useState, useTransition } from "react";
import { InventoryItem, requestUnit, revalidateInventory } from "../../server/actions";
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

export function DashboardClient({ inventory, isAuthenticated, isLoading = false }: { inventory: InventoryItem[], isAuthenticated: boolean, isLoading?: boolean }) {
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
        <div className="w-full h-full space-y-8 pb-10">
            {!isAuthenticated && (
                <div className="fixed inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-sm pointer-events-none transition-colors" />
            )}

            {/* Page Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors">
                        Inventory Overview
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 transition-colors">Real-time status of all FOC devices</p>
                </div>

                <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-900/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-xl transition-colors">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
                <Scorecard title="Total Stock" value={totalStock} icon={<Package className="w-4 h-4" />} />
                <Scorecard title="Available" value={availableCount} icon={<CheckCircle className="w-4 h-4 text-green-400" />} />
                <Scorecard title="On KOL" value={onKolCount} icon={<Clock className="w-4 h-4 text-orange-400" />} />
                <Scorecard title="Unreturn" value={giftedUnitsCount} icon={<Gift className="w-4 h-4 text-cyan-400" />} subtitle="Marked as UNRETURN" />
                <Scorecard title="Pending Returns" value={pendingReturnCount} icon={<ArrowDownRight className="w-4 h-4 text-red-400" />} subtitle="Scheduled items" />
            </div>

            {/* Dashboard Analytics Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">

                {/* Pending Returns Console */}
                <div className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col h-[420px] transition-colors">
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">Return FOC Tracking</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">Comprehensive view of devices due back</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {topUrgentReturns.length > 0 ? (
                            topUrgentReturns.map((item, idx) => {
                                const isAsap = item.plannedReturnDate?.toUpperCase() === 'ASAP';
                                let isOverdue = false;
                                if (!isAsap && item.plannedReturnDate) {
                                    const returnDate = new Date(item.plannedReturnDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    isOverdue = !isNaN(returnDate.getTime()) && returnDate < today;
                                }

                                return (
                                    <div key={idx}
                                        onClick={() => setSelectedItem(item)}
                                        className={cn(
                                            "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden",
                                            isOverdue || isAsap
                                                ? "bg-red-50 dark:bg-red-950/20 border-red-500/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-500/40"
                                                : "bg-white dark:bg-neutral-950/40 border-black/5 dark:border-white/[0.05] hover:bg-neutral-50 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-sm dark:shadow-none"
                                        )}>
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/[0.05] relative transition-colors">
                                                <Smartphone className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                                {(item as any).groupCount > 1 && (
                                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-neutral-100 dark:border-neutral-900">
                                                        {(item as any).groupCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex flex-col items-start gap-1">
                                                <p className="font-semibold text-neutral-900 dark:text-neutral-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.unitName}</p>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/5 transition-colors">
                                                        SEIN PIC: {item.seinPic || "-"}
                                                    </span>
                                                    <span className="text-[10px] bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/5 transition-colors">
                                                        GOAT PIC: {item.goatPic || "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                                            <Badge variant={(isAsap || isOverdue) ? "destructive" : "secondary"} className={cn(
                                                "font-mono text-xs px-2.5 py-1 whitespace-nowrap",
                                                (isAsap || isOverdue)
                                                    ? "bg-red-500/15 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                    : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                                            )}>
                                                {isAsap ? "ASAP" : item.plannedReturnDate}
                                            </Badge>
                                            {isAsap && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">As Soon As Possible</span>}
                                            {isOverdue && !isAsap && <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Overdue</span>}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3 opacity-60">
                                <CheckCircle className="w-12 h-12" />
                                <p>No scheduled returns.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col h-[420px] transition-colors">
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">Recent Activity</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">Latest logistical movements</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-black/10 dark:bg-neutral-800 transition-colors" />

                        <div className="space-y-6 relative">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item, idx) => {
                                    const timestamp = item.fullData?.["Timestamp"] || item.fullData?.["Date Received"] || item.fullData?.["Request Date"] || "Unknown Date";
                                    const isAvailable = item.statusLocation?.toUpperCase().includes("AVAILABLE");

                                    return (
                                        <div key={idx} className="flex gap-4 relative">
                                            {/* Timeline Node */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border z-10 shadow-lg relative transition-colors",
                                                isAvailable
                                                    ? "bg-green-100 dark:bg-green-950/80 border-green-500/30 text-green-600 dark:text-green-400"
                                                    : "bg-blue-100 dark:bg-blue-950/80 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                            )}>
                                                {isAvailable ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>

                                            {/* Content Card */}
                                            <div className="flex-1 bg-white dark:bg-neutral-950/60 border border-black/5 dark:border-white/[0.05] p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition-colors shadow-sm dark:shadow-none">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-2 py-0 border",
                                                        isAvailable
                                                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                                    )}>
                                                        {isAvailable ? "CHECKED IN" : "CHECKED OUT"}
                                                    </Badge>
                                                    <span className="text-xs text-neutral-500 font-mono flex items-center gap-1 transition-colors">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        {timestamp}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-1 transition-colors">{item.unitName || "Unknown Unit"}</h3>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-snug transition-colors">
                                                    {isAvailable ? "Safely returned to Available stock." : `Currently deployed to ${item.onHolder?.trim() || "Unknown Holder"}.`}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-2 font-mono transition-colors">IMEI: {item.imei || "N/A"}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3 opacity-60 mt-20">
                                    <History className="w-12 h-12" />
                                    <p>No recorded activity found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <QuickViewPanel
                item={selectedItem}
                isOpen={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
