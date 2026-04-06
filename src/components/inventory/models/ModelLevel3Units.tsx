"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, RotateCcw, AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DeviceModelGroup, VariantGroup } from "./types";
import type { InventoryItem } from "@/types/inventory";

interface ModelLevel3UnitsProps {
    activeGroup: DeviceModelGroup;
    activeVariant: VariantGroup;
    setSelectedBaseModel: (model: string | null) => void;
    setSelectedVariant: (variant: string | null) => void;
    setSelectedItem: (item: InventoryItem) => void;
}

export function ModelLevel3Units({ activeGroup, activeVariant, setSelectedBaseModel, setSelectedVariant, setSelectedItem }: ModelLevel3UnitsProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm flex-wrap">
                <button
                    onClick={() => { setSelectedBaseModel(null); setSelectedVariant(null); }}
                    className="text-neutral-400 hover:text-blue-400 transition-colors"
                >
                    Models
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                <button
                    onClick={() => setSelectedVariant(null)}
                    className="text-neutral-400 hover:text-blue-400 transition-colors"
                >
                    {activeGroup.baseModel}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-900 dark:text-white font-semibold truncate">{activeVariant.name}</span>
            </div>

            <div className="w-full bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
                {/* Variant Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                            <Smartphone className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight leading-tight mb-0.5">
                                {activeVariant.name}
                            </h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                                {activeVariant.total} unit{activeVariant.total !== 1 ? "s" : ""} recorded
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeVariant.available > 0 && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 text-xs">
                                {activeVariant.available} Available
                            </Badge>
                        )}
                        {activeVariant.loaned > 0 && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1 text-xs">
                                {activeVariant.loaned} Loaned
                            </Badge>
                        )}
                        {activeVariant.returned > 0 && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-xs">
                                <RotateCcw className="w-3 h-3 mr-1" /> {activeVariant.returned} Return
                            </Badge>
                        )}
                        {activeVariant.unreturned > 0 && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" /> {activeVariant.unreturned} Unreturn
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Unit Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar pr-1">
                    <AnimatePresence>
                        {activeVariant.items.map((item, idx) => {
                            const focUp = item.focStatus?.toUpperCase().trim();
                            return (
                                <motion.div
                                    key={`${item.imei}-${idx}`}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
                                    onClick={() => setSelectedItem(item)}
                                    className="group cursor-pointer flex flex-col gap-3 bg-white/90 dark:bg-neutral-950/40 border border-black/5 dark:border-white/5 rounded-2xl p-4 hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all hover:-translate-y-0.5 shadow-sm"
                                >
                                    {/* Row 1: IMEI + Badges */}
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-neutral-400 text-[11px] font-mono truncate">
                                                IMEI: {item.imei || "N/A"}
                                            </p>
                                            <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm mt-1 group-hover:text-blue-500 transition-colors">
                                                {item.onHolder || "No Holder"}
                                            </h4>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] px-2 py-0 whitespace-nowrap",
                                                item.statusLocation?.includes("AVAILABLE")
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : item.statusLocation?.includes("LOANED")
                                                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                                        : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                                            )}>
                                                {item.statusLocation || "UNKNOWN"}
                                            </Badge>
                                            {focUp && focUp !== "-" && (
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] px-2 py-0 whitespace-nowrap font-semibold",
                                                    focUp === "RETURN"
                                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                        : focUp === "UNRETURN"
                                                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                            : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                                                )}>
                                                    {item.focStatus}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Row 2: Details */}
                                    <div className="pt-3 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-400">GOAT PIC</span>
                                            <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate ml-2 text-right">{item.goatPic || "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-400">SEIN PIC</span>
                                            <span className="text-neutral-600 dark:text-neutral-300 font-medium truncate ml-2 text-right">{item.seinPic || "-"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-400">Request</span>
                                            <span className="text-neutral-600 dark:text-neutral-300 font-mono truncate ml-2 text-right">
                                                {item.fullData?.["Step 3 Request Date"] || "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-400">Return</span>
                                            <span className={cn(
                                                "font-mono truncate ml-2 text-right",
                                                item.plannedReturnDate === "ASAP" ? "text-red-400 font-semibold" : "text-neutral-600 dark:text-neutral-300"
                                            )}>
                                                {item.plannedReturnDate || "-"}
                                            </span>
                                        </div>
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
