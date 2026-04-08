"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { RequestFormModal } from "@/components/forms/RequestFormModal";
import { ReturnFormModal } from "@/components/forms/ReturnFormModal";
import { TransferFormModal } from "@/components/forms/TransferFormModal";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useSyncInventory } from "@/hooks/useSyncInventory";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface PageHeaderProps {
    title: string;
    subtitle: string;
    availableUnits: InventoryItem[];
    loanedItems: InventoryItem[];
    allInventory?: InventoryItem[];
    children?: React.ReactNode;
}

/**
 * Shared page header toolbar with theme toggle, sync button, and action buttons.
 * De-duplicates the identical header from Dashboard, Inventory, and KOL clients.
 */
export function PageHeader({ title, subtitle, availableUnits, loanedItems, allInventory, children }: PageHeaderProps) {
    const { isPending, handleSync } = useSyncInventory();

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors mb-1">
                    {title}
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{subtitle}</p>
            </div>

            <div className="flex items-center gap-2 md:gap-3 bg-white/80 dark:bg-neutral-900/40 p-1 md:p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] transition-colors backdrop-blur-xl shadow-xl">
                <CommandPalette inventory={allInventory || [...availableUnits, ...loanedItems]} />
                <ThemeToggle />
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
                <div className="w-px h-6 bg-black/10 dark:bg-white/10 transition-colors" />
                {children}
                <ReturnFormModal loanedItems={loanedItems} />
                <TransferFormModal loanedItems={loanedItems} />
                <RequestFormModal availableItems={availableUnits} />
            </div>
        </div>
    );
}
