"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Smartphone, CheckCircle2, Package, RotateCcw, AlertTriangle, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DeviceModelGroup } from "./types";
import { getModelIcon } from "./utils";

interface ModelLevel2CardsProps {
    activeGroup: DeviceModelGroup;
    setSelectedBaseModel: (model: string | null) => void;
    setSelectedVariant: (variant: string) => void;
}

export function ModelLevel2Cards({ activeGroup, setSelectedBaseModel, setSelectedVariant }: ModelLevel2CardsProps) {
    const [search, setSearch] = useState("");

    const filteredVariants = activeGroup.variants.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setSelectedBaseModel(null)}
                        className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors font-medium bg-black/5 dark:bg-neutral-900/50 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 w-fit hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Models
                    </button>
                </div>

                <div className="bg-white/80 dark:bg-neutral-900/40 p-1 rounded-xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-sm w-full sm:max-w-xs flex items-center focus-within:border-white/[0.15] transition-colors">
                    <Search className="w-4 h-4 text-neutral-500 ml-2.5 shrink-0" />
                    <Input
                        placeholder="Search variants..."
                        className="h-8 text-sm border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white placeholder:text-neutral-500 shadow-none px-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="w-full bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                {/* Model Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0 text-2xl">
                            {getModelIcon(activeGroup.baseModel)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight mb-0.5">
                                {activeGroup.baseModel}
                            </h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                                {activeGroup.variantCount} variant{activeGroup.variantCount !== 1 ? "s" : ""} · {activeGroup.total} units total
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 text-xs">
                            {activeGroup.available} Available
                        </Badge>
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1 text-xs">
                            {activeGroup.loaned} Loaned
                        </Badge>
                        {activeGroup.returned > 0 && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs">
                                <RotateCcw className="w-3 h-3 mr-1" /> {activeGroup.returned} Return
                            </Badge>
                        )}
                        {activeGroup.unreturned > 0 && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" /> {activeGroup.unreturned} Unreturn
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Variant Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
                    <AnimatePresence>
                        {filteredVariants.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-neutral-500">
                                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>No variants found matching "{search}"</p>
                            </div>
                        ) : filteredVariants.map((variant, vIdx) => {
                            const loanPercent = variant.total > 0 ? (variant.loaned / variant.total) * 100 : 0;

                            return (
                                <motion.div
                                    key={variant.name}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(vIdx * 0.05, 0.3) }}
                                    onClick={() => setSelectedVariant(variant.name)}
                                    className="group cursor-pointer bg-white/90 dark:bg-neutral-950/40 border border-black/5 dark:border-white/5 hover:border-blue-500/30 rounded-2xl p-5 transition-all hover:bg-blue-50/30 dark:hover:bg-blue-950/10 hover:-translate-y-0.5 shadow-sm flex flex-col"
                                >
                                    {/* Top: Icon + Unit count */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600/15 to-cyan-600/15 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-500/10">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-neutral-700 dark:from-white to-neutral-400 dark:to-neutral-500">
                                                {variant.total}
                                            </div>
                                            <div className="text-[10px] text-neutral-400">
                                                unit{variant.total !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variant Name */}
                                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white truncate leading-tight mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={variant.name}>
                                        {variant.name}
                                    </h3>

                                    {/* Mini utilization bar */}
                                    <div className="mb-3">
                                        <div className="h-1 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
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

                                    {/* Stats: Stock + Loaned */}
                                    <div className="grid grid-cols-2 gap-2 text-xs font-medium mb-2">
                                        <div className="flex items-center gap-1.5 p-1.5 bg-green-500/5 rounded-lg border border-green-500/10">
                                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                            <span className="text-neutral-500">Stock</span>
                                            <span className="text-green-500 ml-auto font-bold">{variant.available}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 p-1.5 bg-orange-500/5 rounded-lg border border-orange-500/10">
                                            <Package className="w-3 h-3 text-orange-500 shrink-0" />
                                            <span className="text-neutral-500">Loan</span>
                                            <span className="text-orange-500 ml-auto font-bold">{variant.loaned}</span>
                                        </div>
                                    </div>

                                    {/* FOC Status badges */}
                                    {(variant.returned > 0 || variant.unreturned > 0) && (
                                        <div className="flex items-center gap-2 mt-1">
                                            {variant.returned > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                                                    <RotateCcw className="w-3 h-3" />
                                                    <span>{variant.returned} Return</span>
                                                </div>
                                            )}
                                            {variant.unreturned > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] text-red-400 font-medium">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>{variant.unreturned} Unreturn</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-auto pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] text-neutral-400">
                                        <span>View {variant.total} unit{variant.total !== 1 ? "s" : ""}</span>
                                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
