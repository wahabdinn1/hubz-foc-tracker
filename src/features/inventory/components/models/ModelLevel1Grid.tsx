"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, CheckCircle2, Package, Layers, RotateCcw, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceModelGroup } from "./types";
import { getModelIcon } from "./utils";
import { EmptyState } from "@/components/ui/EmptyState";

interface ModelLevel1GridProps {
    filteredGroups: DeviceModelGroup[];
    modelSearch: string;
    setSelectedBaseModel: (model: string) => void;
}

export function ModelLevel1Grid({ 
    filteredGroups, 
    modelSearch, 
    setSelectedBaseModel 
}: ModelLevel1GridProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {filteredGroups.length === 0 ? (
                <div className="py-12">
                    <EmptyState
                        icon={Smartphone}
                        title="No models found"
                        description={`No models matching "${modelSearch}"`}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence>
                        {filteredGroups.map((group, idx) => {
                            const loanPercent = group.total > 0 ? (group.loaned / group.total) * 100 : 0;

                            return (
                                <motion.div
                                    key={group.baseModel}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.3) }}
                                    onClick={() => setSelectedBaseModel(group.baseModel)}
                                    className="group cursor-pointer bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.05] hover:border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl transition-all hover:bg-neutral-50 dark:hover:bg-white/5 hover:-translate-y-1 shadow-lg flex flex-col"
                                >
                                    {/* Top: Icon + Count */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/20 to-cyan-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(37,99,235,0.1)] border border-blue-500/20 text-xl">
                                            {getModelIcon(group.baseModel)}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-neutral-700 dark:from-white to-neutral-400 dark:to-neutral-500">
                                                {group.total}
                                            </div>
                                            <div className="text-[10px] text-neutral-400 font-medium flex items-center gap-1 justify-end">
                                                <Layers className="w-3 h-3" />
                                                {group.variantCount} variant{group.variantCount !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Model Name */}
                                    <h3 className="font-bold text-lg text-neutral-900 dark:text-white truncate leading-tight mb-3" title={group.baseModel}>
                                        {group.baseModel}
                                    </h3>

                                    {/* Utilization bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1.5">
                                            <span>Utilization</span>
                                            <span className="font-mono">{Math.round(loanPercent)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all duration-500",
                                                    loanPercent > 80 ? "bg-red-500" :
                                                        loanPercent > 50 ? "bg-amber-500" :
                                                            "bg-emerald-500"
                                                )}
                                                style={{ width: `${loanPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="mt-auto grid grid-cols-2 gap-2 text-xs font-medium">
                                        <div className="flex flex-col gap-1 p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                                            <span className="text-neutral-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Stock</span>
                                            <span className="text-green-400 text-sm">{group.available}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                                            <span className="text-neutral-500 flex items-center gap-1"><Package className="w-3 h-3 text-orange-500" /> Loaned</span>
                                            <span className="text-orange-400 text-sm">{group.loaned}</span>
                                        </div>
                                    </div>

                                    {/* FOC Status row */}
                                    {(group.returned > 0 || group.unreturned > 0) && (
                                        <div className="mt-2 flex items-center gap-2">
                                            {group.returned > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span>{group.returned} Return</span>
                                                </div>
                                            )}
                                            {group.unreturned > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>{group.unreturned} Unreturn</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer hint */}
                                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-neutral-400">
                                        <span>Click to explore variants</span>
                                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
