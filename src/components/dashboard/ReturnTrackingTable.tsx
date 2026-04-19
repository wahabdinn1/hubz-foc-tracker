import type { InventoryItem, ReturnTrackingItem } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Smartphone, CheckCircle } from "lucide-react";
import { isItemOverdue } from "@/lib/date-utils";
import { calculateUrgencyProgress } from "@/lib/device-utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface ReturnTrackingProps {
    topUrgentReturns: ReturnTrackingItem[];
    setSelectedItem: (item: InventoryItem) => void;
}

export function ReturnTrackingTable({ topUrgentReturns, setSelectedItem }: ReturnTrackingProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: topUrgentReturns.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 92, // Approximate height of each item
        overscan: 5,
    });

    return (
        <div className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-3 md:p-6 backdrop-blur-xl shadow-2xl flex flex-col min-h-[50vh] max-h-[60vh] md:min-h-[500px] md:max-h-[640px] transition-colors">
            <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">Return FOC Tracking</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">Comprehensive view of devices due back</p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                {topUrgentReturns.length > 0 ? (
                    <div 
                        style={{ 
                            height: `${rowVirtualizer.getTotalSize()}px`, 
                            width: '100%', 
                            position: 'relative' 
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                            const idx = virtualItem.index;
                            const item = topUrgentReturns[idx];
                            const isAsap = item.plannedReturnDate?.toUpperCase() === 'ASAP';
                            const overdue = isItemOverdue(item);
                            const { percent: progressPercent, color: progressColor } = calculateUrgencyProgress(item);

                            return (
                                <div
                                    key={`${item.imei}-${item.unitName}-${idx}`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                    className="pb-3" // Space between items
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setSelectedItem(item)}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedItem(item); } }}
                                        className={cn(
                                            "group relative overflow-hidden flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all cursor-pointer h-full",
                                            overdue || isAsap
                                                ? "bg-red-50 dark:bg-red-950/20 border-red-500/20 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-500/40"
                                                : "bg-white dark:bg-neutral-950/40 border-black/5 dark:border-white/[0.05] hover:bg-neutral-50 dark:hover:bg-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-sm dark:shadow-none"
                                        )}>
                                        <div className="flex items-center gap-3 md:gap-4 min-w-0 z-10">
                                            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/[0.05] relative transition-colors">
                                                <Smartphone className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                                {item.groupCount > 1 ? (
                                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-neutral-100 dark:border-neutral-900">
                                                        {item.groupCount}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex flex-col items-start gap-1">
                                                <p className="font-semibold text-neutral-900 dark:text-neutral-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.unitName}</p>
                                                <div className="hidden sm:flex gap-2">
                                                    <span className="text-[10px] bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/5 transition-colors">
                                                        SEIN PIC: {item.seinPic || "-"}
                                                    </span>
                                                    <span className="text-[10px] bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-md border border-black/5 dark:border-white/5 transition-colors">
                                                        GOAT PIC: {item.goatPic || "-"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 ml-4 shrink-0 z-10">
                                            <Badge variant={(isAsap || overdue) ? "destructive" : "secondary"} className={cn(
                                                "font-mono text-xs px-2.5 py-1 whitespace-nowrap",
                                                (isAsap || overdue)
                                                    ? "bg-red-500/15 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                                    : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                                            )}>
                                                {isAsap ? "ASAP" : item.plannedReturnDate}
                                            </Badge>
                                            {isAsap ? <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">As Soon As Possible</span> : null}
                                            {overdue && !isAsap ? <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Overdue</span> : null}
                                        </div>
                                        {/* Health/Timeline Bar */}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5">
                                            <div className={cn("h-full transition-all duration-1000 ease-out", progressColor)} style={{ width: `${progressPercent}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-3 opacity-60">
                        <CheckCircle className="w-12 h-12" />
                        <p>No scheduled returns.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
