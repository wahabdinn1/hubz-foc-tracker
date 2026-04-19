"use client";

import { useState } from "react";
import type { InventoryItem, OverdueItem, ReturnHistoryItem } from "@/types/inventory";
import { Scorecard } from "@/components/shared/Scorecard";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import dynamic from "next/dynamic"

const QuickViewPanel = dynamic(
    () => import("@/components/shared/QuickViewPanel").then((mod) => mod.QuickViewPanel),
    { ssr: false }
)
import { ReturnTrackingTable } from "./ReturnTrackingTable";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardDonutChart } from "./DashboardDonutChart";
import { OverduePanel } from "./OverduePanel";
import { ReturnHistoryPanel } from "./ReturnHistoryPanel";
import { DateRangePicker } from "./DateRangePicker";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useInventoryStats, DashboardDateRange } from "@/hooks/useInventoryStats";
import { motion } from "framer-motion";
import {
    Package, CheckCircle, Clock, Gift, ArrowDownRight
} from "lucide-react";
import type { DateRange } from "react-day-picker";

// ── Animation constants (extracted to avoid re-creation on every render) ──
const CONTAINER_VARIANTS = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const;

const ITEM_VARIANTS = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
} as const;

const SECTION_ENTER = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.3, duration: 0.4 }
};

// ── Default props constants ──
const EMPTY_OVERDUE: OverdueItem[] = [];
const EMPTY_RETURN_HISTORY: ReturnHistoryItem[] = [];

interface DashboardClientProps {
    inventory: InventoryItem[];
    isAuthenticated: boolean;
    overdueItems?: OverdueItem[];
    returnHistory?: ReturnHistoryItem[];
}

export function DashboardClient({ inventory, isAuthenticated, overdueItems = EMPTY_OVERDUE, returnHistory = EMPTY_RETURN_HISTORY }: DashboardClientProps) {
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

    return (
        <div className="w-full h-full space-y-6 md:space-y-8 pb-10 p-4 md:p-10">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none transition-colors" />

            {!isAuthenticated && (
                <div className="fixed inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-sm pointer-events-none transition-colors" />
            )}

            {/* ── Header + Date Filter ── */}
            <PageHeader
                title="Inventory Overview"
                subtitle="Real-time status of all FOC devices"
                availableUnits={availableUnits}
                loanedItems={loanedItems}
                allInventory={inventory}
            />

            <div className="flex items-center justify-between relative z-10 w-full mb-4">
                <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            </div>

            {/* ── Scorecards ── */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 relative z-10"
                variants={CONTAINER_VARIANTS}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={ITEM_VARIANTS}><Scorecard title="Total Stock" value={totalStock} icon={<Package className="w-4 h-4" />} /></motion.div>
                <motion.div variants={ITEM_VARIANTS}><Scorecard title="Available" value={availableCount} icon={<CheckCircle className="w-4 h-4 text-green-400" />} onClick={() => router.push('/inventory?filter=available')} /></motion.div>
                <motion.div variants={ITEM_VARIANTS}><Scorecard title="On KOL" value={onKolCount} icon={<Clock className="w-4 h-4 text-orange-400" />} onClick={() => router.push('/inventory?filter=loaned')} /></motion.div>
                <motion.div variants={ITEM_VARIANTS}><Scorecard title="Unreturn" value={giftedUnitsCount} icon={<Gift className="w-4 h-4 text-cyan-400" />} subtitle="Marked as UNRETURN" onClick={() => router.push('/inventory?filter=unreturn')} /></motion.div>
                <motion.div variants={ITEM_VARIANTS}><Scorecard title="Pending Returns" value={pendingReturnCount} icon={<ArrowDownRight className="w-4 h-4 text-red-400" />} subtitle="Scheduled items" onClick={() => router.push('/inventory?filter=loaned')} /></motion.div>
            </motion.div>

            {/* ── ⚠️ Overdue Alert (urgency-first — always visible after scorecards) ── */}
            {overdueItems.length > 0 && (
                <ErrorBoundary fallbackTitle="Failed to load overdue panel">
                    <div className="relative z-10">
                        <OverduePanel overdueItems={overdueItems} />
                    </div>
                </ErrorBoundary>
            )}

            {/* ── Main Analytics Grid ── */}
            <motion.div
                className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 relative z-10 items-stretch"
                {...SECTION_ENTER}
            >
                {/* Left: Return Tracking (primary content — gets more vertical space) */}
                <ErrorBoundary fallbackTitle="Failed to load return tracking">
                    <ReturnTrackingTable
                        topUrgentReturns={topUrgentReturns}
                        setSelectedItem={setSelectedItem}
                    />
                </ErrorBoundary>

                {/* Right: Compact Donut + Activity Feed */}
                <div className="flex flex-col gap-4 md:gap-6 h-full">
                    <ErrorBoundary fallbackTitle="Failed to load distribution chart">
                        <DashboardDonutChart
                            availableCount={availableCount}
                            onKolCount={onKolCount}
                            unreturnCount={giftedUnitsCount}
                        />
                    </ErrorBoundary>
                    <ErrorBoundary fallbackTitle="Failed to load activity feed">
                        <ActivityFeed
                            recentActivity={recentActivity}
                        />
                    </ErrorBoundary>
                </div>
            </motion.div>

            {/* ── Return History (compact, expandable — uses previously dead code) ── */}
            <ErrorBoundary fallbackTitle="Failed to load return history">
                <div className="relative z-10">
                    <ReturnHistoryPanel returnHistory={returnHistory} />
                </div>
            </ErrorBoundary>

            <QuickViewPanel
                item={selectedItem}
                isOpen={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
