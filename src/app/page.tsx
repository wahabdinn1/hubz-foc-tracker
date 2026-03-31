import type { Metadata } from "next";
import { getInventory } from "@/server/actions";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PinModal } from "@/components/shared/PinModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/Skeletons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Hubz FOC Tracker",
  description: "Real-time inventory overview, return tracking, and activity feed for all FOC devices.",
};

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
