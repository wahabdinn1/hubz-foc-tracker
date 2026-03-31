import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from "@/types/inventory";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";
import { QUICKVIEW_HIDDEN_KEYS } from "@/lib/constants";
import { isEmptyValue, getReturnUrgency } from "@/lib/date-utils";

interface QuickViewPanelProps {
    item: InventoryItem | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuickViewPanel({ item, isOpen, onOpenChange }: QuickViewPanelProps) {
    if (!item) return null;

    const requestDate = item.fullData?.["Step 3 Request Date"] || item.fullData?.["Request Date"];
    const urgency = getReturnUrgency(item.plannedReturnDate);
    const showTimeline = !isEmptyValue(requestDate) || !isEmptyValue(item.plannedReturnDate);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-lg bg-white/95 dark:bg-neutral-950/95 transition-colors border-l border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 custom-scrollbar shadow-2xl p-4 sm:p-6">
                <SheetHeader className="mb-4 sm:mb-6 space-y-3">
                    <div className="flex items-start justify-between gap-3 pr-6">
                        <div className="space-y-1 text-left min-w-0">
                            <SheetTitle className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white transition-colors tracking-tight leading-tight">{item.unitName || "Unnamed Unit"}</SheetTitle>
                            <SheetDescription className="text-neutral-500 dark:text-neutral-400 font-mono text-xs sm:text-sm break-all">
                                IMEI: {item.imei || "N/A"}
                            </SheetDescription>
                        </div>
                        <Badge variant="outline" className={cn(
                            "px-3 py-1 text-xs select-none",
                            item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                item.statusLocation?.toUpperCase().includes("LOANED") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20"
                        )}>
                            {item.statusLocation || "UNKNOWN"}
                        </Badge>
                    </div>
                </SheetHeader>

                {/* ── Request Timeline Section ── */}
                {showTimeline && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/30">
                        <h4 className="text-[10px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 sm:mb-3 flex items-center gap-1.5">
                            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> Request Timeline
                        </h4>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Request Date */}
                            <div className="flex-1 text-center min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-medium mb-1">Requested</p>
                                <p className="text-xs sm:text-sm font-mono font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                                    {isEmptyValue(requestDate) ? "—" : requestDate}
                                </p>
                            </div>

                            <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-neutral-400 shrink-0" />

                            {/* Target Return */}
                            <div className="flex-1 text-center min-w-0">
                                <p className="text-[9px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 uppercase font-medium mb-1">Target Return</p>
                                <p className={cn("text-xs sm:text-sm font-mono font-semibold truncate", urgency?.color || "text-neutral-800 dark:text-neutral-200")}>
                                    {isEmptyValue(item.plannedReturnDate) ? "—" : item.plannedReturnDate}
                                </p>
                            </div>
                        </div>

                        {/* Urgency badge */}
                        {urgency && (
                            <div className={cn(
                                "mt-3 text-center text-xs font-semibold py-1.5 rounded-lg",
                                urgency.daysLeft < 0 ? "bg-red-500/10 text-red-500 dark:text-red-400" :
                                    urgency.daysLeft <= 7 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            )}>
                                {urgency.label}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Complete Data Record ── */}
                <div className="space-y-4 pb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 transition-colors flex-1" />
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest px-2">Complete Data Record</span>
                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 transition-colors flex-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(item.fullData || {})
                            .filter(([key, value]) => {
                                const k = key.trim().toLowerCase();
                                // Filter out ghost/empty columns
                                if (QUICKVIEW_HIDDEN_KEYS.has(k)) return false;
                                if (k === "" && isEmptyValue(value)) return false;
                                // Also filter by substring for headers with possible whitespace variations
                                if (k.includes("unknown column")) return false;
                                if (k.includes("received date time stamp")) return false;
                                if (k.includes("return to tcc receipt")) return false;
                                if (k.includes("step 3 request date")) return false;
                                if (k === "comments") return false;
                                return true;
                            })
                            .map(([key, value]) => {
                                const displayValue = value && value.trim() !== "" ? value : "—";
                                const isDate = key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp');
                                const isLink = value?.startsWith('http');
                                const isEmpty = displayValue === "—";

                                return (
                                    <div key={key} className="flex flex-col space-y-1.5 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 transition-colors border border-black/5 dark:border-neutral-800/50 hover:bg-black/5 dark:hover:bg-neutral-800/50">
                                        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{key}</span>
                                        {isLink ? (
                                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline break-all">
                                                {displayValue}
                                            </a>
                                        ) : (
                                            <span className={cn(
                                                "text-sm font-medium whitespace-pre-wrap",
                                                isEmpty ? "text-neutral-300 dark:text-neutral-600 italic" : "text-neutral-900 dark:text-neutral-200",
                                                isDate ? "font-mono" : ""
                                            )}>
                                                {displayValue}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
