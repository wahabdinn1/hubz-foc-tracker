import { getInventory } from "../../server/actions";
import { DashboardClient } from "@/components/DashboardClient";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PinModal } from "@/components/PinModal";
import { isAuthenticated } from "@/lib/auth";
import { Suspense } from "react";

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
        <Suspense fallback={<DashboardClient inventory={[]} isAuthenticated={true} isLoading={true} />}>
          <DashboardFetcher />
        </Suspense>
      )}
    </DashboardLayout>
  );
}
