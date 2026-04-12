import type { Metadata } from "next";
import { getDashboardData } from "@/server/actions";
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

export default function Page() {
  return (
    <DashboardLayout>
      <ErrorBoundary fallbackTitle="Failed to load dashboard">
        <Suspense fallback={<PageSkeleton />}>
          <DashboardFetcher />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
