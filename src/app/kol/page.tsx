import { getInventory } from "@/server/actions";
import { KOLClient } from "@/components/KOLClient";
import { Suspense } from "react";
import { PinModal } from "@/components/PinModal";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { PageSkeleton } from "@/components/Skeletons";

export const dynamic = "force-dynamic";

async function KOLFetcher() {
    const inventory = await getInventory();
    return <KOLClient inventory={inventory} />;
}

export default async function KOLPage() {
    const authed = await isAuthenticated();

    return (
        <DashboardLayout>
            {!authed ? (
                <PinModal />
            ) : (
                <ErrorBoundary fallbackTitle="Failed to load KOL data">
                    <Suspense fallback={<PageSkeleton />}>
                        <KOLFetcher />
                    </Suspense>
                </ErrorBoundary>
            )}
        </DashboardLayout>
    );
}
