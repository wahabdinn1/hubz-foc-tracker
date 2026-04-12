"use client";

import { useState } from "react";
import type { InventoryItem, OverdueItem, ReturnHistoryItem } from "@/types/inventory";
import { Scorecard } from "@/components/shared/Scorecard";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuickViewPanel } from "@/components/shared/QuickViewPanel";
import { ReturnTrackingTable } from "./ReturnTrackingTable";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardDonutChart } from "./DashboardDonutChart";
import { OverduePanel } from "./OverduePanel";
import { ReturnHistoryPanel } from "./ReturnHistoryPanel";
import { useInventoryStats, DashboardDateRange } from "@/hooks/useInventoryStats";
import { motion } from "framer-motion";
import {
    Package, CheckCircle, Clock, Gift, ArrowDownRight, Calendar as CalendarIcon
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DashboardClientProps {
    inventory: InventoryItem[];
    isAuthenticated: boolean;
    overdueItems?: OverdueItem[];
    returnHistory?: ReturnHistoryItem[];
}

export function DashboardClient({ inventory, isAuthenticated, overdueItems = [], returnHistory = [] }: DashboardClientProps) {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const {
        totalStock,
        availableCount,
        onKolCount,
        giftedUnitsCount,
        pendingReturnCount,
        topUrgentReturns,
        availableUnits,
        loanedItems,
        recentActivity
    } = useInventoryStats(inventory, dateRange as DashboardDateRange);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="w-full h-full space-y-6 md:space-y-8 pb-10 p-4 md:p-10">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none transition-colors" />

            {!isAuthenticated && (
                <div className="fixed inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-sm pointer-events-none transition-colors" />
            )}

            {/* Header Area */}
            <PageHeader
                title="Inventory Overview"
                subtitle="Real-time status of all FOC devices"
                availableUnits={availableUnits}
                loanedItems={loanedItems}
                allInventory={inventory}
            />

            {/* Dashboard Controls */}
            <div className="flex items-center justify-between relative z-10 w-full mb-4">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Filter by Date Range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors" align="start">
                            <Calendar
                                autoFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                                className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-md border-neutral-200 dark:border-neutral-800"
                            />
                        </PopoverContent>
                    </Popover>
                    {(dateRange?.from || dateRange?.to) && (
                        <Button variant="ghost" size="sm" onClick={() => setDateRange(undefined)} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                            Clear Filter
                        </Button>
                    )}
                </div>
            </div>

            {/* Scorecards */}
            <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={itemVariants}><Scorecard title="Total Stock" value={totalStock} icon={<Package className="w-4 h-4" />} /></motion.div>
                <motion.div variants={itemVariants}><Scorecard title="Available" value={availableCount} icon={<CheckCircle className="w-4 h-4 text-green-400" />} onClick={() => router.push('/inventory?filter=available')} /></motion.div>
                <motion.div variants={itemVariants}><Scorecard title="On KOL" value={onKolCount} icon={<Clock className="w-4 h-4 text-orange-400" />} onClick={() => router.push('/inventory?filter=loaned')} /></motion.div>
                <motion.div variants={itemVariants}><Scorecard title="Unreturn" value={giftedUnitsCount} icon={<Gift className="w-4 h-4 text-cyan-400" />} subtitle="Marked as UNRETURN" onClick={() => router.push('/inventory?filter=unreturn')} /></motion.div>
                <motion.div variants={itemVariants}><Scorecard title="Pending Returns" value={pendingReturnCount} icon={<ArrowDownRight className="w-4 h-4 text-red-400" />} subtitle="Scheduled items" onClick={() => router.push('/inventory?filter=loaned')} /></motion.div>
            </motion.div>

            {/* Dashboard Analytics Layout */}
            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10 items-stretch"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                <ReturnTrackingTable
                    topUrgentReturns={topUrgentReturns}
                    setSelectedItem={setSelectedItem}
                />
                <div className="flex flex-col gap-4 md:gap-6 h-full">
                    <DashboardDonutChart 
                        availableCount={availableCount} 
                        onKolCount={onKolCount} 
                        unreturnCount={giftedUnitsCount} 
                    />
                    <ActivityFeed
                        recentActivity={recentActivity}
                    />
                </div>
            </motion.div>

            {/* Overdue + Return History */}
            {(overdueItems.length > 0 || returnHistory.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10">
                    <OverduePanel overdueItems={overdueItems} />
                    <ReturnHistoryPanel returnHistory={returnHistory} />
                </div>
            )}

            <QuickViewPanel
                item={selectedItem}
                isOpen={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
