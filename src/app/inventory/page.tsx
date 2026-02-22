import { getInventory } from "@/server/actions";
import { InventoryClient } from "@/components/InventoryClient";
import { Suspense } from "react";
import { PinModal } from "@/components/PinModal";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { PageSkeleton } from "@/components/Skeletons";

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
                <ErrorBoundary fallbackTitle="Failed to load inventory">
                    <Suspense fallback={<PageSkeleton />}>
                        <InventoryFetcher />
                    </Suspense>
                </ErrorBoundary>
            )}
        </DashboardLayout>
    );
}
