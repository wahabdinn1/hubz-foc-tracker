"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, RotateCcw, AlertTriangle, ArrowLeft, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export function ModelLevel3Units({ activeGroup, activeVariant, setSelectedBaseModel: _setSelectedBaseModel, setSelectedVariant, setSelectedItem }: ModelLevel3UnitsProps) {
    const [search, setSearch] = useState("");

    const filteredItems = activeVariant.items.filter(item => 
        item.imei?.toLowerCase().includes(search.toLowerCase()) ||
        item.goatPic?.toLowerCase().includes(search.toLowerCase()) ||
        item.seinPic?.toLowerCase().includes(search.toLowerCase()) ||
        item.onHolder?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                    <button
                        onClick={() => setSelectedVariant(null)}
                        className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors font-medium bg-black/5 dark:bg-neutral-900/50 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 w-fit hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to {activeGroup.baseModel}
                    </button>
                    <span className="text-neutral-300 dark:text-neutral-700 mx-1">/</span>
                    <span className="text-neutral-900 dark:text-white font-semibold truncate bg-white/50 dark:bg-neutral-800/50 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5">{activeVariant.name}</span>
                </div>

                <div className="bg-white/80 dark:bg-neutral-900/40 p-1 rounded-xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-sm w-full sm:max-w-xs flex items-center focus-within:border-white/[0.15] transition-colors">
                    <Search className="w-4 h-4 text-neutral-500 ml-2.5 shrink-0" />
                    <Input
                        placeholder="Search IMEI or Holder..."
                        className="h-8 text-sm border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white placeholder:text-neutral-500 shadow-none px-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
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

                {/* Grid Table */}
                <div className="flex flex-col relative max-h-[calc(100vh-380px)] overflow-y-auto custom-scrollbar [content-visibility:auto]">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 mb-4 px-4 lg:px-8 py-4 bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-xl rounded-2xl border border-black/[0.05] dark:border-white/[0.05] shadow-sm mx-1 mt-1">
                        <div className="hidden lg:grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 items-center">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Unit Identity</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Serial / IMEI</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Custodian</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">GOAT PIC</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Log Date</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">FOC Class</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 text-right">Vault Status</div>
                        </div>
                        <div className="lg:hidden flex justify-between items-center text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                            <span>Ledger Operations</span>
                            <span>{filteredItems.length} Records</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <AnimatePresence>
                            {filteredItems.length === 0 ? (
                                <div className="py-12 text-center text-neutral-500">
                                    <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p>No units found matching &ldquo;{search}&rdquo;</p>
                                </div>
                            ) : filteredItems.map((item, idx) => {
                                const focUp = item.focStatus?.toUpperCase().trim();
                                return (
                                    <motion.div
                                        key={`${item.imei}-${idx}`}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.3) }}
                                        onClick={() => setSelectedItem(item)}
                                        className="grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-y-4 gap-x-4 px-4 lg:px-8 py-4 lg:py-3 items-center group relative border-b border-black/[0.02] dark:border-white/[0.02] last:border-0 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Unit Identity */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform shrink-0">
                                                <Smartphone size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display leading-tight truncate">
                                                    {item.unitName || "-"}
                                                </h4>
                                                <span className="lg:hidden text-[10px] font-mono text-zinc-400 truncate block">
                                                    {item.imei || "-"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Serial / IMEI */}
                                        <div className="hidden lg:block">
                                            <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/[0.03] dark:bg-white/[0.05] px-2 py-1 rounded-lg border border-black/[0.05] dark:border-white/[0.05] truncate block w-fit">
                                                {item.imei || "-"}
                                            </code>
                                        </div>

                                        {/* Custodian */}
                                        <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium truncate">
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Holder</span>
                                            {item.onHolder || "-"}
                                        </div>

                                        {/* GOAT PIC */}
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">PIC</span>
                                            <div className="flex items-center gap-2">
                                                {(item.goatPic || item.seinPic) && (item.goatPic || item.seinPic) !== "-" && (
                                                    <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold shrink-0">
                                                        {((item.goatPic || item.seinPic) as string).substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-[11px] text-zinc-500 truncate">{(item.goatPic || item.seinPic) || "-"}</span>
                                            </div>
                                        </div>

                                        {/* Log Date */}
                                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-bold truncate">
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Date</span>
                                            {item.step3Data?.timestamp && item.step3Data.timestamp.trim() !== "" && item.step3Data.timestamp !== "-" ? item.step3Data.timestamp : "—"}
                                        </div>

                                        {/* FOC Class */}
                                        <div>
                                            <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Class</span>
                                            <div className={cn(
                                                "w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                focUp === "RETURN" ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                                                    focUp === "UNRETURN" ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                                                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                            )}>
                                                {!focUp || focUp === "-" ? "—" : focUp}
                                            </div>
                                        </div>

                                        {/* Vault Status */}
                                        <div className="flex items-center gap-2 lg:justify-end truncate">
                                            <div className={cn(
                                                "shrink-0 w-1.5 h-1.5 rounded-full",
                                                item.statusLocation?.toUpperCase().includes("AVAILABLE") ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" :
                                                item.statusLocation?.toUpperCase().includes("LOANED") ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" :
                                                "bg-zinc-300 dark:bg-zinc-700"
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                item.statusLocation?.toUpperCase().includes("AVAILABLE") ? "text-zinc-900 dark:text-white" :
                                                item.statusLocation?.toUpperCase().includes("LOANED") ? "text-orange-500" :
                                                "text-zinc-500"
                                            )}>
                                                {item.statusLocation || "UNKNOWN"}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
