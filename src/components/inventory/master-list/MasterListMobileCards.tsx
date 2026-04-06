import { motion, AnimatePresence } from "framer-motion";
import { Search, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { isItemOverdue } from "@/lib/date-utils";
import type { InventoryItem } from "@/types/inventory";

interface MasterListMobileCardsProps {
    paginatedInventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
}

export function MasterListMobileCards({ paginatedInventory, setSelectedItem }: MasterListMobileCardsProps) {
    return (
        <div className="block md:hidden p-3 space-y-3">
            <AnimatePresence mode="popLayout">
                {paginatedInventory.length > 0 ? (
                    paginatedInventory.map((item, idx) => {
                        const overdue = isItemOverdue(item);

                        return (
                            <motion.div
                                key={`${item.imei}-${item.unitName}-${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15, delay: Math.min(idx * 0.05, 0.3) }}
                                onClick={() => setSelectedItem(item)}
                                className={cn(
                                    "flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all shadow-sm",
                                    overdue ? "bg-red-50 dark:bg-red-950/20 border-red-500/30" : "bg-white dark:bg-neutral-900 border-black/5 dark:border-white/[0.05]"
                                )}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.unitName || "Unknown Unit"}</h3>
                                        <p className="font-mono text-[11px] text-neutral-500 mt-1 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> {item.imei || "N/A"}</p>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "shrink-0 whitespace-nowrap text-[10px] px-2 py-0.5",
                                        item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                    )}>
                                        {item.statusLocation}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-1 border-t border-black/5 dark:border-white/5 pt-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest mb-0.5">Holder</span>
                                        <span className="text-neutral-700 dark:text-neutral-300 font-medium text-xs truncate">{item.onHolder || "-"}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest mb-0.5">FOC Status</span>
                                        <span className={cn(
                                            "font-medium text-xs",
                                            item.focStatus?.toUpperCase().trim() === "RETURN" ? "text-green-500" :
                                                item.focStatus?.toUpperCase().trim() === "UNRETURN" ? "text-red-500" :
                                                    "text-neutral-500 dark:text-neutral-400"
                                        )}>{item.focStatus || "-"}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="py-8">
                        <EmptyState icon={Search} title="No devices found" description="We couldn't find any inventory matching your search or filter criteria." />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
