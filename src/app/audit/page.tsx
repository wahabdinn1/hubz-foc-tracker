import { Metadata } from "next";
import { getRequestHistory, getReturnHistory } from "@/server/actions";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PinModal } from "@/components/shared/PinModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/Skeletons";

export const metadata: Metadata = {
    title: "Audit Log | FOC Tracker",
    description: "Activity audit log for Hubz FOC inventory",
};

export const revalidate = 60; // Revalidate every minute

async function AuditFetcher() {
    const authed = await isAuthenticated();
    if (!authed) return <PinModal />;

    const [requests, returns] = await Promise.all([
        getRequestHistory(),
        getReturnHistory()
    ]);
    return (
        <div className="w-full h-full space-y-4 md:space-y-6 pb-10 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors mb-1">
                        Audit Log
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        Exhaustive chronological history of all device requests and returns. Search across {requests.length + returns.length} total events.
                    </p>
                </div>
            </div>
            
            <AuditLogTable requests={requests} returns={returns} />
        </div>
    );
}

export default function AuditPage() {
    return (
        <DashboardLayout>
            <ErrorBoundary fallbackTitle="Failed to load audit log">
                <Suspense fallback={<PageSkeleton />}>
                    <AuditFetcher />
                </Suspense>
            </ErrorBoundary>
        </DashboardLayout>
    );
}
