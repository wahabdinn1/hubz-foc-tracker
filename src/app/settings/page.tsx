import { isSettingsUnlocked, getCCRecipients } from "@/app/actions/settings";
import { PinScreen } from "@/components/PinScreen";
import { SettingsDashboard } from "@/components/SettingsDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata = {
  title: "Settings — Hubz FOC Tracker",
};

export default async function SettingsPage() {
  const unlocked = await isSettingsUnlocked();

  if (!unlocked) {
    return (
      <DashboardLayout>
        <PinScreen />
      </DashboardLayout>
    );
  }

  const recipients = await getCCRecipients();

  return (
    <DashboardLayout>
      <ErrorBoundary fallbackTitle="Failed to load settings">
        <SettingsDashboard initialRecipients={recipients} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
