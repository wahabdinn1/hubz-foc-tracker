import type { Metadata } from "next";
import { getInventory } from "@/features/inventory/actions/queries";
import { KOLClient } from "@/components/kol/KOLClient";
import { Suspense } from "react";
import { PinModal } from "@/components/shared/PinModal";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/features/auth/utils";
import { PageSkeleton } from "@/components/shared/Skeletons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "KOL Management — Hubz FOC Tracker",
  description: "Key Opinion Leader directory with device assignment history and contact details.",
};

async function KOLFetcher() {
    const authed = await isAuthenticated();
    if (!authed) return <PinModal />;

    const inventory = await getInventory();
    return <KOLClient inventory={inventory} />;
}

export default function KOLPage() {
    return (
        <DashboardLayout>
            <DashboardErrorBoundary 
              fallbackTitle="Failed to load KOL data"
              fallbackDescription="We encountered an issue while loading KOL management. Please try refreshing the page."
            >
                <Suspense fallback={<PageSkeleton />}>
                    <KOLFetcher />
                </Suspense>
            </DashboardErrorBoundary>
        </DashboardLayout>
    );
}
