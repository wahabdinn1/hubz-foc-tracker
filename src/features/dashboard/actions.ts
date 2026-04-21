"use server";

import { getDashboardFullData } from "@/features/inventory/actions/queries";
import { aggregateDashboardData, type DashboardDateRange } from "./utils";

export async function getDashboardData(dateRange?: DashboardDateRange) {
  const { inventory, overdueItems, returnHistory } = await getDashboardFullData();

  const stats = aggregateDashboardData(inventory, dateRange);

  return { 
    stats, 
    overdueItems, 
    returnHistory 
  };
}
