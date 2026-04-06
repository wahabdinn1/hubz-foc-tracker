import type { Metadata } from "next";
import { getInventory } from "@/server/actions";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { Suspense } from "react";
import { PinModal } from "@/components/shared/PinModal";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { PageSkeleton } from "@/components/shared/Skeletons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory Bank — Hubz FOC Tracker",
  description: "Browse all FOC devices by Master List, Device Models, or Campaigns with search and filters.",
};

async function InventoryFetcher({ initialFilter }: { initialFilter?: string }) {
    const inventory = await getInventory();
    return <InventoryClient inventory={inventory} initialFilter={initialFilter} />;
}

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const authed = await isAuthenticated();
    const params = await searchParams;

    return (
        <DashboardLayout>
            {!authed ? (
                <PinModal />
            ) : (
                <ErrorBoundary fallbackTitle="Failed to load inventory">
                    <Suspense fallback={<PageSkeleton />}>
                        <InventoryFetcher initialFilter={params.filter} />
                    </Suspense>
                </ErrorBoundary>
            )}
        </DashboardLayout>
    );
}
