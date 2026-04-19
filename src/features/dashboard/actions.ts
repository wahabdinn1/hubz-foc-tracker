"use server";

import { getInventory, getOverdueData, getReturnHistory } from "@/features/inventory/actions/queries";
import { aggregateDashboardData, type DashboardDateRange } from "./utils";

export async function getDashboardData(dateRange?: DashboardDateRange) {
  const [inventory, overdueItems, returnHistory] = await Promise.all([
    getInventory(),
    getOverdueData(),
    getReturnHistory(),
  ]);

  const stats = aggregateDashboardData(inventory, dateRange);

  return { 
    stats, 
    overdueItems, 
    returnHistory 
  };
}
