"use client";

import type { OverdueItem } from "@/types/inventory";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface OverduePanelProps {
    overdueItems: OverdueItem[];
}

export function OverduePanel({ overdueItems }: OverduePanelProps) {
    if (overdueItems.length === 0) return null;

    // Show max 8 items
    const displayItems = overdueItems.slice(0, 8);
    const remaining = overdueItems.length - displayItems.length;

    return (
        <motion.div
            className="bg-white/80 dark:bg-neutral-900/40 border border-red-500/20 dark:border-red-500/10 rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
        >
            {/* Urgent glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">
                            Overdue Devices
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">
                            {overdueItems.length} device{overdueItems.length !== 1 ? "s" : ""} past return date
                        </p>
                    </div>
                </div>
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs font-bold px-3">
                    {overdueItems.length} OVERDUE
                </Badge>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {displayItems.map((item, idx) => (
                    <div
                        key={`${item.serialNumber}-${idx}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/60 dark:bg-neutral-950/40 border border-black/5 dark:border-white/[0.05] hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors group"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-200 truncate transition-colors">
                                {item.materialDescription || "Unknown Device"}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-mono text-neutral-500 truncate">
                                    SN: {item.serialNumber}
                                </span>
                                {item.seinPic && (
                                    <span className="text-xs text-neutral-400">
                                        • PIC: {item.seinPic}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                                <Badge variant="outline" className={cn(
                                    "text-xs font-bold px-2 py-0.5",
                                    item.overdueDays > 30
                                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                                        : item.overdueDays > 14
                                            ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}>
                                    <Clock className="w-3 h-3 mr-1 inline" />
                                    {item.overdueDays}d
                                </Badge>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-red-400 transition-colors" />
                        </div>
                    </div>
                ))}
                {remaining > 0 && (
                    <p className="text-xs text-neutral-400 text-center pt-2">
                        + {remaining} more overdue device{remaining !== 1 ? "s" : ""}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
