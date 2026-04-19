import type { Metadata } from "next";
import { getInventory } from "@/server/inventory";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { Suspense } from "react";
import { PinModal } from "@/components/shared/PinModal";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { PageSkeleton } from "@/components/shared/Skeletons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Inventory Bank — Hubz FOC Tracker",
  description: "Browse all FOC devices by Master List, Device Models, or Campaigns with search and filters.",
};

async function InventoryFetcher({ searchParamsPromise }: { searchParamsPromise: Promise<{ filter?: string }> }) {
    const authed = await isAuthenticated();
    if (!authed) return <PinModal />;

    const params = await searchParamsPromise;
    const inventory = await getInventory();
    return <InventoryClient inventory={inventory} initialFilter={params.filter} />;
}

export default function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    return (
        <DashboardLayout>
            <DashboardErrorBoundary 
              fallbackTitle="Failed to load inventory"
              fallbackDescription="We encountered an issue while loading the inventory. Please try refreshing the page."
            >
                <Suspense fallback={<PageSkeleton />}>
                    <InventoryFetcher searchParamsPromise={searchParams} />
                </Suspense>
            </DashboardErrorBoundary>
        </DashboardLayout>
    );
}
