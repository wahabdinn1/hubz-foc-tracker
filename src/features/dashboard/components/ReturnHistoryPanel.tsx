"use client";

import React, { useRef } from "react";
import type { ReturnHistoryItem } from "@/types/inventory";
import { Undo2, Calendar, User, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";

interface ReturnHistoryPanelProps {
    returnHistory: ReturnHistoryItem[];
}

export const ReturnHistoryPanel = React.memo(function ReturnHistoryPanel({ returnHistory }: ReturnHistoryPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/incompatible-library
    const rowVirtualizer = useVirtualizer({
        count: returnHistory.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 84, // Approximate height of each item
        overscan: 5,
    });

    if (returnHistory.length === 0) {
        return (
            <div className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Undo2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">Return History</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">Device return submissions</p>
                    </div>
                </div>
                <div className="h-[150px] flex flex-col items-center justify-center text-neutral-500 gap-2 px-4 text-center border-2 border-dashed border-black/5 dark:border-white/5 rounded-2xl bg-white/30 dark:bg-neutral-900/20">
                    <Undo2 className="w-8 h-8 text-emerald-500/40" />
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No returns recorded yet</p>
                    <p className="text-xs text-neutral-400">Returns submitted via the form will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Undo2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight transition-colors">Return History</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm transition-colors">
                            {returnHistory.length} return{returnHistory.length !== 1 ? "s" : ""} recorded
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/audit"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-1"
                    >
                        View All
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-bold px-3">
                        {returnHistory.length} Total
                    </Badge>
                </div>
            </div>

            {/* Set max-height for ~5 items (84px * 5 ≈ 420px) */}
            <div 
                ref={scrollRef} 
                className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 relative"
            >
                <div 
                    style={{ 
                        height: `${rowVirtualizer.getTotalSize()}px`, 
                        width: '100%', 
                        position: 'relative' 
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                        const item = returnHistory[virtualItem.index];
                        return (
                            <div
                                key={`${item.imei}-${item.timestamp}-${virtualItem.index}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                                className="pb-2" // Add some spacing between items
                            >
                                <div className="flex flex-col gap-2 p-3 h-full rounded-xl bg-white/60 dark:bg-neutral-950/40 border border-black/5 dark:border-white/[0.05] hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-colors">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-200 truncate transition-colors">
                                            {item.unitName || "Unknown Device"}
                                        </p>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-2 py-0 shrink-0">
                                            RETURNED
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            From: {item.fromKol || "Unknown"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {item.timestamp || "Unknown date"}
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono text-neutral-400 truncate">
                                        IMEI: {item.imei || "N/A"} • By: {item.requestor || "Unknown"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
});

ReturnHistoryPanel.displayName = "ReturnHistoryPanel";
