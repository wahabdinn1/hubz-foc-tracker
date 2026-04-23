"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import dynamic from "next/dynamic";

const RequestFormModal = dynamic(
    () => import("@/features/inventory/components/forms/RequestFormModal").then((mod) => mod.RequestFormModal),
    { ssr: false }
);

const ReturnFormModal = dynamic(
    () => import("@/features/inventory/components/forms/ReturnFormModal").then((mod) => mod.ReturnFormModal),
    { ssr: false }
);

const TransferFormModal = dynamic(
    () => import("@/features/inventory/components/forms/TransferFormModal").then((mod) => mod.TransferFormModal),
    { ssr: false }
);
import { useSyncInventory } from "@/hooks/useSyncInventory";
import { useAutoSync, useAutoSyncEnabled } from "@/hooks/useAutoSync";
import { cn } from "@/lib/utils";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

const EMPTY_INVENTORY: InventoryItem[] = [];
const AUTO_SYNC_INTERVAL = 30000;

interface PageHeaderProps {
    title: string;
    subtitle: string;
    availableUnits?: InventoryItem[];
    loanedItems?: InventoryItem[];
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, availableUnits = EMPTY_INVENTORY, loanedItems = EMPTY_INVENTORY, children }: PageHeaderProps) {
    const { isPending, handleSync } = useSyncInventory();
    const { autoSyncEnabled, toggleAutoSync } = useAutoSyncEnabled();
    const { nextSyncIn } = useAutoSync(handleSync, isPending, AUTO_SYNC_INTERVAL, autoSyncEnabled);

    const countdownSec = Math.ceil(nextSyncIn / 1000);

    return (
        <div className="w-full flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6 relative z-10 mb-6 md:mb-12">
            {/* Title — scaled down on mobile */}
            <div className="space-y-1 md:space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white font-display">
                    {title.split(' ')[0]} <span className="text-zinc-400 dark:text-zinc-600">{title.split(' ').slice(1).join(' ')}</span>
                </h1>
                <p className="text-xs md:text-sm text-zinc-500 font-medium max-w-md hidden sm:block">{subtitle}</p>
            </div>

            {/* Toolbar — compact on mobile, glassmorphic on desktop */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/80 dark:bg-white/[0.03] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-black/[0.05] dark:border-white/[0.08] backdrop-blur-2xl shadow-lg dark:shadow-none w-full xl:w-auto overflow-hidden">
                {/* System Status — inline pill */}
                <div className="flex items-center gap-2 pl-2 pr-3 border-r border-black/[0.05] dark:border-white/[0.05] shrink-0">
                    <div className="relative flex h-2 w-2 shrink-0">
                        {autoSyncEnabled && (
                            <>
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isPending ? "bg-blue-400" : "bg-emerald-400")} />
                                <span className={cn("relative inline-flex rounded-full h-2 w-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]", isPending ? "bg-blue-500" : "bg-emerald-500")} />
                            </>
                        )}
                        {!autoSyncEnabled && <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400" />}
                    </div>
                    <div className="flex flex-col -space-y-0.5 shrink-0">
                        <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">System</span>
                        {autoSyncEnabled ? (
                            <span className={cn("text-[9px] sm:text-[10px] font-mono font-bold", isPending ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400")}>
                                {isPending ? "SYNC..." : `LIVE · ${countdownSec}s`}
                            </span>
                        ) : (
                            <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 font-bold">OFF</span>
                        )}
                    </div>
                </div>

                {/* Utility icons — wifi, refresh, theme */}
                <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleAutoSync}
                        className={cn(
                            "h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-400",
                            autoSyncEnabled ? "hover:text-emerald-600 dark:hover:text-emerald-400" : "hover:text-zinc-600 dark:hover:text-zinc-300"
                        )}
                    >
                        {autoSyncEnabled ? <Wifi size={13} /> : <WifiOff size={13} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSync}
                        disabled={isPending}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 group"
                    >
                        <RefreshCw size={13} className={cn("group-active:rotate-180 transition-transform duration-500", isPending && "animate-spin")} />
                    </Button>
                    <ThemeToggle />
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-black/8 dark:bg-white/8 shrink-0 hidden sm:block" />

                {/* Action buttons — isolated transforms to prevent parent bleed */}
                <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
                    {children}
                    <div className="isolate"><TransferFormModal loanedItems={loanedItems} /></div>
                    <div className="isolate"><RequestFormModal availableItems={availableUnits} /></div>
                    <div className="isolate"><ReturnFormModal loanedItems={loanedItems} /></div>
                </div>
            </div>
        </div>
    );
}
