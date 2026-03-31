/**
 * Shared date/urgency utilities used across Dashboard, Inventory,
 * and QuickView components.
 */

/** Classification result for return dates */
export interface ReturnUrgency {
  label: string;
  daysLeft: number;
  color: "text-red-500" | "text-amber-500" | "text-emerald-500";
  className: string;
}

/**
 * Check whether a value should be treated as "empty" in the context
 * of spreadsheet cells (blank, dash, N/A, etc.).
 */
export function isEmptyValue(v: string | undefined | null): boolean {
  return !v || v.trim() === "" || v.trim() === "-" || v.trim() === "N/A";
}

/**
 * Compute urgency classification from a target-return date string.
 * Returns null when the date is empty or unparseable.
 */
export function getReturnUrgency(
  dateStr: string | undefined
): ReturnUrgency | null {
  if (!dateStr || dateStr.trim() === "" || dateStr === "-" || dateStr === "N/A")
    return null;

  if (dateStr === "ASAP") {
    return {
      label: "ASAP",
      daysLeft: -999,
      color: "text-red-500",
      className: "text-red-500 font-bold",
    };
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      label: `${Math.abs(daysLeft)}d overdue`,
      daysLeft,
      color: "text-red-500",
      className: "text-red-500 font-semibold",
    };
  }
  if (daysLeft === 0) {
    return {
      label: "Due today",
      daysLeft,
      color: "text-red-500",
      className: "text-red-500 font-semibold",
    };
  }
  if (daysLeft <= 7) {
    return {
      label: `${daysLeft}d remaining`,
      daysLeft,
      color: "text-amber-500",
      className: "text-amber-500 font-semibold",
    };
  }
  return {
    label: `${daysLeft}d remaining`,
    daysLeft,
    color: "text-emerald-500",
    className: "text-neutral-700 dark:text-neutral-300",
  };
}

/**
 * Check whether an inventory item is overdue based on its status fields.
 * An item is overdue when:
 *  - focStatus is "RETURN"
 *  - statusLocation includes "LOANED"
 *  - plannedReturnDate is a valid past date
 */
export function isItemOverdue(item: {
  focStatus?: string;
  statusLocation?: string;
  plannedReturnDate?: string;
}): boolean {
  if (item.focStatus?.trim().toUpperCase() !== "RETURN") return false;
  if (!item.statusLocation?.toUpperCase().includes("LOANED")) return false;
  if (
    !item.plannedReturnDate ||
    item.plannedReturnDate === "N/A" ||
    item.plannedReturnDate === "ASAP"
  )
    return false;

  const returnDate = new Date(item.plannedReturnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(returnDate.getTime()) && returnDate < today;
}
