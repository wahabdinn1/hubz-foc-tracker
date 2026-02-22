import { getInventory } from "../../../server/actions";
import { InventoryClient } from "@/components/InventoryClient";
import { Suspense } from "react";
import { PinModal } from "@/components/PinModal";
import { DashboardLayout } from "@/components/DashboardLayout";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function InventoryFetcher() {
    const inventory = await getInventory();
    return <InventoryClient inventory={inventory} />;
}

export default async function InventoryPage() {
    const authed = await isAuthenticated();

    return (
        <DashboardLayout>
            {!authed ? (
                <PinModal />
            ) : (
                <Suspense fallback={<div className="p-10 text-neutral-500 dark:text-neutral-400 animate-pulse transition-colors">Loading Inventory data...</div>}>
                    <InventoryFetcher />
                </Suspense>
            )}
        </DashboardLayout>
    );
}
