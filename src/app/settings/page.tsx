import { isSettingsUnlocked, getCCRecipients, getDropdownOptions } from "@/app/actions/settings";
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

  const [recipients, dropdownOptions] = await Promise.all([
    getCCRecipients(),
    getDropdownOptions()
  ]);

  return (
    <DashboardLayout>
      <ErrorBoundary
        fallbackTitle="Failed to load settings"
        fallbackDescription="We encountered an issue while loading the settings page. Please try refreshing the page."
        resetErrorTimeout={30000}
      >
        <SettingsDashboard initialRecipients={recipients} initialDropdownOptions={dropdownOptions} />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
