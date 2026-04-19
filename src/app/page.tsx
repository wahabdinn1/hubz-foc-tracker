import type { Metadata } from "next";
import { getDashboardData } from "@/server/inventory";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PinModal } from "@/components/shared/PinModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { isAuthenticated } from "@/lib/auth";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/shared/Skeletons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dashboard — Hubz FOC Tracker",
  description: "Real-time inventory overview, return tracking, and activity feed for all FOC devices.",
};

async function DashboardFetcher() {
  const authed = await isAuthenticated();
  if (!authed) return <PinModal />;

  const { inventory, overdueItems, returnHistory } = await getDashboardData();
  return <DashboardClient inventory={inventory} isAuthenticated={true} overdueItems={overdueItems} returnHistory={returnHistory} />
}

import { DashboardErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function Page() {
  return (
    <DashboardLayout>
      <DashboardErrorBoundary 
        fallbackTitle="Failed to load dashboard"
        fallbackDescription="We encountered an issue while loading the dashboard. Please try refreshing the page."
      >
        <Suspense fallback={<PageSkeleton />}>
          <DashboardFetcher />
        </Suspense>
      </DashboardErrorBoundary>
    </DashboardLayout>
  );
}
