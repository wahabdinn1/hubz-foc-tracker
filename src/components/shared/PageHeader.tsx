"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { RequestFormModal } from "@/components/forms/RequestFormModal";
import { ReturnFormModal } from "@/components/forms/ReturnFormModal";
import { TransferFormModal } from "@/components/forms/TransferFormModal";
import dynamic from "next/dynamic"

const CommandPalette = dynamic(
    () => import("@/components/shared/CommandPalette").then((mod) => mod.CommandPalette),
    { ssr: false }
)
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
    allInventory?: InventoryItem[];
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, availableUnits = EMPTY_INVENTORY, loanedItems = EMPTY_INVENTORY, allInventory, children }: PageHeaderProps) {
    const { isPending, handleSync } = useSyncInventory();
    const { autoSyncEnabled, toggleAutoSync } = useAutoSyncEnabled();
    const { nextSyncIn } = useAutoSync(handleSync, isPending, AUTO_SYNC_INTERVAL, autoSyncEnabled);

    const countdownSec = Math.ceil(nextSyncIn / 1000);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors mb-1">
                    {title}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{subtitle}</p>
            </div>

            <div className="flex items-center gap-2 md:gap-3 bg-white/80 dark:bg-neutral-900/40 p-1 md:p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] transition-colors backdrop-blur-xl shadow-xl overflow-x-auto max-w-full scrollbar-none shrink-0">
                {/* Auto-sync toggle + Live indicator */}
                <div className="flex items-center gap-1.5 pl-2">
                    {autoSyncEnabled && (
                        <div className="flex items-center gap-1.5 mr-1">
                            <span className={cn(
                                "relative flex h-2 w-2",
                                isPending ? "" : ""
                            )}>
                                <span className={cn(
                                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                    isPending ? "bg-blue-400" : "bg-green-400"
                                )} />
                                <span className={cn(
                                    "relative inline-flex rounded-full h-2 w-2",
                                    isPending ? "bg-blue-500" : "bg-green-500"
                                )} />
                            </span>
                            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                Live · {countdownSec}s
                            </span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleAutoSync}
                        className={cn(
                            "h-8 w-8 rounded-lg transition-colors",
                            autoSyncEnabled
                                ? "text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-white/5"
                        )}
                        title={autoSyncEnabled ? "Disable auto-sync" : "Enable auto-sync"}
                    >
                        {autoSyncEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSync}
                    disabled={isPending}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5 rounded-xl transition-colors"
                    title="Force Sync with Google Sheets"
                >
                    <RefreshCw className={cn("w-5 h-5", isPending && "animate-spin text-blue-500 dark:text-blue-400")} />
                </Button>

                <ThemeToggle />

                <CommandPalette inventory={allInventory || [...availableUnits, ...loanedItems]} />
                <div className="w-px h-6 bg-black/10 dark:bg-white/10 transition-colors" />
                {children}
                <ReturnFormModal loanedItems={loanedItems} />
                <TransferFormModal loanedItems={loanedItems} />
                <RequestFormModal availableItems={availableUnits} />
            </div>
        </div>
    );
}
