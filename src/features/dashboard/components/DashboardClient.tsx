"use client";

import { useState } from "react";
import type { InventoryItem, OverdueItem, ReturnHistoryItem } from "@/types/inventory";
import { Scorecard } from "@/components/shared/Scorecard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import dynamic from "next/dynamic"

const QuickViewPanel = dynamic(
    () => import("@/components/shared/QuickViewPanel").then((mod) => mod.QuickViewPanel),
    { ssr: false }
)
const ActivityFeed = dynamic(
    () => import("./ActivityFeed").then((mod) => mod.ActivityFeed),
    { ssr: false }
)
const ReturnHistoryPanel = dynamic(
    () => import("./ReturnHistoryPanel").then((mod) => mod.ReturnHistoryPanel),
    { ssr: false }
)

import { ReturnTrackingTable } from "./ReturnTrackingTable";
import { OverduePanel } from "./OverduePanel";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { motion } from "framer-motion";
import {
    Package, CheckCircle, Clock, Gift, ArrowDownRight, Settings2, ChevronRight
} from "lucide-react";
import { type DashboardData } from "../utils";

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
    isAuthenticated: boolean;
    overdueItems?: OverdueItem[];
    returnHistory?: ReturnHistoryItem[];
    initialStats: DashboardData;
}

export function DashboardClient({ 
    isAuthenticated, 
    overdueItems = EMPTY_OVERDUE, 
    returnHistory = EMPTY_RETURN_HISTORY,
    initialStats
}: DashboardClientProps) {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const {
        totalStock,
        availableCount,
        onKolCount,
        giftedUnitsCount,
        pendingReturnCount,
        topUrgentReturns,
        availableUnits,
        loanedItems,
        recentActivity,
        allInventory
    } = initialStats;


    return (
        <div className="w-full h-full flex flex-col gap-6 md:gap-8 pb-10 p-4 md:p-10 relative overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/5 dark:bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none" />

            {!isAuthenticated ? (
                <div className="fixed inset-0 z-40 bg-white/60 dark:bg-black/60 backdrop-blur-sm pointer-events-none transition-colors" />
            ) : null}

            {/* ── Dashboard Header ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                <PageHeader
                    title="Inventory Overview"
                    subtitle="Real-time status of all FOC devices"
                    availableUnits={availableUnits}
                    loanedItems={loanedItems}
                />
                
                {/* Secondary Actions / Breadcrumbs could go here if needed */}
            </div>

            {/* ── Main Scorecard Section ── */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 relative z-10"
                variants={CONTAINER_VARIANTS}
                initial="hidden"
                animate="show"
            >
                {/* Primary Hero Card */}
                <motion.div variants={ITEM_VARIANTS} className="lg:col-span-4 h-full">
                    <div className="group relative h-full overflow-hidden rounded-[24px] bg-blue-600 p-6 shadow-2xl shadow-blue-500/20">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Package size={140} strokeWidth={1} aria-hidden="true" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <p className="text-blue-100/80 text-xs font-bold uppercase tracking-[0.2em] mb-1">Fleet Management</p>
                                <h2 className="text-white text-3xl font-extrabold tracking-tight">Total Inventory</h2>
                            </div>
                            <div className="mt-8">
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-6xl font-black text-white tracking-tighter tabular-nums">{totalStock}</span>
                                    <span className="text-blue-200 font-bold text-lg italic">Units</span>
                                </div>
                                <div className="flex gap-1 h-1.5 w-full bg-blue-700/50 rounded-full overflow-hidden" role="progressbar" aria-label="Inventory distribution breakdown">
                                    <div className="h-full bg-green-400" style={{ width: `${(availableCount/totalStock)*100}%` }} aria-label={`${availableCount} Available`} />
                                    <div className="h-full bg-white/60" style={{ width: `${(onKolCount/totalStock)*100}%` }} aria-label={`${onKolCount} Loaned`} />
                                    <div className="h-full bg-red-400" style={{ width: `${(giftedUnitsCount/totalStock)*100}%` }} aria-label={`${giftedUnitsCount} Gifted`} />
                                </div>
                                <div className="flex justify-between mt-3">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                        <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">{availableCount} Available</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                        <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">{onKolCount} Loaned</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Secondary Status Cards */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div variants={ITEM_VARIANTS}>
                        <Scorecard 
                            title="Available Units" 
                            value={availableCount} 
                            icon={<CheckCircle className="text-green-500" />} 
                            subtitle="Ready for new FOC request"
                            onClick={() => router.push('/inventory?filter=available')}
                            className="h-full"
                        />
                    </motion.div>
                    <motion.div variants={ITEM_VARIANTS}>
                        <Scorecard 
                            title="On-Loan (KOL)" 
                            value={onKolCount} 
                            icon={<Clock className="text-orange-500" />} 
                            subtitle="Currently out for review"
                            onClick={() => router.push('/inventory?filter=loaned')}
                            className="h-full"
                        />
                    </motion.div>
                    <motion.div variants={ITEM_VARIANTS}>
                        <Scorecard 
                            title="Gifted / Unreturn" 
                            value={giftedUnitsCount} 
                            icon={<Gift className="text-cyan-500" />} 
                            subtitle="Ownership transferred"
                            onClick={() => router.push('/inventory?filter=unreturn')}
                            className="h-full"
                        />
                    </motion.div>
                    <motion.div variants={ITEM_VARIANTS}>
                        <Scorecard 
                            title="Scheduled Returns" 
                            value={pendingReturnCount} 
                            icon={<ArrowDownRight className="text-red-500" />} 
                            subtitle="Expected back soon"
                            onClick={() => router.push('/inventory?filter=loaned')}
                            className="h-full"
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* ── Main Dashboard Content Grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 relative z-10 items-stretch">
                
                {/* ── WORK CENTER (Left, 66%) ── */}
                <div className="xl:col-span-2 flex flex-col gap-6 md:gap-8">
                    {/* Urgent Alerts */}
                    {overdueItems.length > 0 ? (
                        <ErrorBoundary fallbackTitle="Failed to load overdue panel">
                            <motion.div {...SECTION_ENTER}>
                                <OverduePanel overdueItems={overdueItems} />
                            </motion.div>
                        </ErrorBoundary>
                    ) : null}

                    {/* Return Tracking */}
                    <ErrorBoundary fallbackTitle="Failed to load return tracking">
                        <motion.div 
                            {...SECTION_ENTER}
                            className="flex flex-col"
                        >
                            <ReturnTrackingTable
                                topUrgentReturns={topUrgentReturns}
                                setSelectedItem={setSelectedItem}
                            />
                        </motion.div>
                    </ErrorBoundary>

                    {/* Return History */}
                    <ErrorBoundary fallbackTitle="Failed to load return history">
                        <motion.div {...SECTION_ENTER}>
                            <ReturnHistoryPanel returnHistory={returnHistory} />
                        </motion.div>
                    </ErrorBoundary>
                </div>

                {/* ── STATUS HUB (Right, 33%) ── */}
                <div className="xl:col-span-1 flex flex-col gap-6 md:gap-8">
                    {/* Quick Access to Settings */}
                    <Link href="/settings" className="block">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-5 rounded-2xl md:rounded-3xl bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] hover:border-blue-500/30 hover:bg-blue-500/5 dark:hover:bg-blue-500/5 transition-all duration-300 group flex items-center justify-between backdrop-blur-xl shadow-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-600/10 flex items-center justify-center border border-blue-500/20 group-hover:from-blue-500/25 group-hover:to-blue-600/20 transition-all duration-300">
                                    <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">Settings & Configuration</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage CC recipients and dropdowns</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-blue-500 transition-colors" aria-hidden="true" />
                        </motion.div>
                    </Link>

                    {/* Live Activity Feed */}
                    <ErrorBoundary fallbackTitle="Failed to load activity feed">
                        <motion.div 
                            {...SECTION_ENTER}
                            className="flex-1 min-h-[400px]"
                        >
                            <ActivityFeed recentActivity={recentActivity} />
                        </motion.div>
                    </ErrorBoundary>
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
