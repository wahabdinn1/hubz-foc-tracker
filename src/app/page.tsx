import { getInventory } from "@/server/actions";
import { DashboardClient } from "@/components/DashboardClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PinModal } from "@/components/PinModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/Skeletons";

export const dynamic = "force-dynamic";

async function DashboardFetcher() {
  const inventory = await getInventory();
  return <DashboardClient inventory={inventory} isAuthenticated={true} />
}

export default async function Page() {
  const authed = await isAuthenticated();

  return (
    <DashboardLayout>
      {!authed ? (
        <PinModal />
      ) : (
        <ErrorBoundary fallbackTitle="Failed to load dashboard">
          <Suspense fallback={<PageSkeleton />}>
            <DashboardFetcher />
          </Suspense>
        </ErrorBoundary>
      )}
    </DashboardLayout>
  );
}
