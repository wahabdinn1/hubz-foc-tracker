"use client";

import { useState, useTransition } from "react";
import type { InventoryItem, OverdueItem, ReturnHistoryItem } from "@/types/inventory";
import { revalidateInventory } from "@/server/actions";
import { Scorecard } from "@/components/shared/Scorecard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RequestFormModal } from "@/components/forms/RequestFormModal";
import { ReturnFormModal } from "@/components/forms/ReturnFormModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { QuickViewPanel } from "@/components/shared/QuickViewPanel";
import { cn } from "@/lib/utils";
import { ReturnTrackingTable } from "./ReturnTrackingTable";
import { ActivityFeed } from "./ActivityFeed";
import { DashboardDonutChart } from "./DashboardDonutChart";
import { OverduePanel } from "./OverduePanel";
import { ReturnHistoryPanel } from "./ReturnHistoryPanel";
import { useInventoryStats } from "@/hooks/useInventoryStats";
import { motion } from "framer-motion";
import {
    Package, CheckCircle, Clock, Gift, RefreshCw, ArrowDownRight,
} from "lucide-react";

interface DashboardClientProps {
    inventory: InventoryItem[];
    isAuthenticated: boolean;
    overdueItems?: OverdueItem[];
    returnHistory?: ReturnHistoryItem[];
}

export function DashboardClient({ inventory, isAuthenticated, overdueItems = [], returnHistory = [] }: DashboardClientProps) {
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
    } = useInventoryStats(inventory);

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
