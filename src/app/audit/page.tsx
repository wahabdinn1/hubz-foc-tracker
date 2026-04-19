import { Metadata } from "next";
import { getRequestHistory, getReturnHistory, getInventory } from "@/server/inventory";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PinModal } from "@/components/shared/PinModal";
import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/Skeletons";
import { AuditHeader } from "@/components/audit/AuditHeader";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Audit Log | FOC Tracker",
    description: "Activity audit log for Hubz FOC inventory",
};

async function AuditFetcher() {
    const authed = await isAuthenticated();
    if (!authed) return <PinModal />;

    const [requests, returns, inventory] = await Promise.all([
        getRequestHistory(),
        getReturnHistory(),
        getInventory(),
    ]);
    return (
        <div className="w-full h-full space-y-4 md:space-y-6 pb-10 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AuditHeader inventory={inventory} eventCount={requests.length + returns.length} />
            <AuditLogTable requests={requests} returns={returns} />
        </div>
    );
}

export default function AuditPage() {
    return (
        <DashboardLayout>
            <DashboardErrorBoundary 
              fallbackTitle="Failed to load audit log"
              fallbackDescription="We encountered an issue while loading the audit log. Please try refreshing the page."
            >
                <Suspense fallback={<PageSkeleton />}>
                    <AuditFetcher />
                </Suspense>
            </DashboardErrorBoundary>
        </DashboardLayout>
    );
}
