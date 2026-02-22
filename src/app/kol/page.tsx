import { getInventory } from "../../../server/actions";
import { KOLClient } from "@/components/KOLClient";
import { Suspense } from "react";
import { PinModal } from "@/components/PinModal";
import { DashboardLayout } from "@/components/DashboardLayout";
import { isAuthenticated } from "@/lib/auth";

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
                <Suspense fallback={<div className="p-10 text-neutral-500 dark:text-neutral-400 animate-pulse transition-colors">Loading KOL data...</div>}>
                    <KOLFetcher />
                </Suspense>
            )}
        </DashboardLayout>
    );
}
