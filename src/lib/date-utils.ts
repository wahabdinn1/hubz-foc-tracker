import { parse, isValid } from "date-fns";

export interface ReturnUrgency {
  label: string;
  daysLeft: number;
  color: "text-red-500" | "text-amber-500" | "text-emerald-500";
  className: string;
}

export function isEmptyValue(v: string | undefined | null): boolean {
  return !v || v.trim() === "" || v.trim() === "-" || v.trim() === "N/A";
}

function parseDateAsUTC(dateStr: string): Date | null {
  const formats = ["M/d/yyyy H:mm:ss", "M/d/yyyy", "yyyy-MM-dd"];
  for (const fmt of formats) {
    const d = parse(dateStr, fmt, new Date(0));
    if (isValid(d)) {
      return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }
  }
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) {
    return new Date(Date.UTC(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()));
  }
  return null;
}

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

  const d = parseDateAsUTC(dateStr);
  if (!d) return null;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const diffMs = d.getTime() - todayUTC.getTime();
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

  const returnDate = parseDateAsUTC(item.plannedReturnDate);
  if (!returnDate) return false;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return returnDate < todayUTC;
}
