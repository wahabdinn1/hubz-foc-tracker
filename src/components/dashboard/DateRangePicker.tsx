"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
}

/**
 * Standalone date range picker for the dashboard.
 * Extracted from DashboardClient to enforce single-responsibility.
 */
export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="dashboard-date-filter"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} –{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Filter by Date Range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors" align="start">
                    <Calendar
                        autoFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={onDateRangeChange}
                        numberOfMonths={2}
                        className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-md border-neutral-200 dark:border-neutral-800"
                    />
                </PopoverContent>
            </Popover>
            {(dateRange?.from || dateRange?.to) && (
                <Button variant="ghost" size="sm" onClick={() => onDateRangeChange(undefined)} className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Clear Filter
                </Button>
            )}
        </div>
    );
}
