"use client";

import { useTransition } from "react";
import { revalidateInventory } from "@/server/actions";
import { toast } from "sonner";

/**
 * Shared hook for syncing inventory data with Google Sheets.
 * De-duplicates the identical sync logic from Dashboard, Inventory, and KOL clients.
 */
export function useSyncInventory() {
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

    return { isPending, handleSync };
}
