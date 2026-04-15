import type { InventoryItem } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { History, ArrowDownRight, ArrowUpRight, Calendar as CalendarIcon } from "lucide-react";
import { isStatusAvailable } from "@/lib/constants";

interface ActivityFeedProps {
    recentActivity: InventoryItem[];
}

export function ActivityFeed({ recentActivity }: ActivityFeedProps) {
    return (
        <div className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl flex flex-col flex-1 min-h-[300px] transition-colors">
            <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">Recent Activity</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">Latest logistical movements</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-black/10 dark:bg-neutral-800 transition-colors" />

                <div className="space-y-6 relative">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((item, idx) => {
                            const timestamp = item.step3Data?.timestamp || item.step1Data?.dateOfReceipt || "Unknown Date";
                            const isAvailable = isStatusAvailable(item.statusLocation);

                            return (
                                <div key={`${item.imei}-${item.unitName}-${idx}`} className="flex gap-4 relative">
                                    {/* Timeline Node */}
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border z-10 shadow-lg relative transition-colors",
                                        isAvailable
                                            ? "bg-green-100 dark:bg-green-950/80 border-green-500/30 text-green-600 dark:text-green-400"
                                            : "bg-blue-100 dark:bg-blue-950/80 border-blue-500/30 text-blue-600 dark:text-blue-400"
                                    )}>
                                        {isAvailable ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 bg-white dark:bg-neutral-950/60 border border-black/5 dark:border-white/[0.05] p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition-colors shadow-sm dark:shadow-none">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] px-2 py-0 border",
                                                isAvailable
                                                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                            )}>
                                                {isAvailable ? "CHECKED IN" : "CHECKED OUT"}
                                            </Badge>
                                            <span className="text-xs text-neutral-500 font-mono flex items-center gap-1 transition-colors">
                                                <CalendarIcon className="w-3 h-3" />
                                                {timestamp}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-neutral-900 dark:text-white text-sm mb-1 transition-colors">{item.unitName || "Unknown Unit"}</h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-snug transition-colors">
                                            {isAvailable ? "Safely returned to Available stock." : `Currently deployed to ${item.onHolder?.trim() || "Unknown Holder"}.`}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-2 font-mono transition-colors">IMEI: {item.imei || "N/A"}</p>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-neutral-500 gap-2 mt-4 px-4 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl bg-white/30 dark:bg-neutral-900/20">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-2">
                                <History className="w-6 h-6 text-blue-500" />
                            </div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-200 text-base">No recorded activity yet</p>
                            <p className="text-xs max-w-[220px] leading-relaxed">
                                Use the <strong className="text-blue-500">New Request</strong> or <strong className="text-red-400">Inbound (Return)</strong> buttons above to log your first transaction.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
