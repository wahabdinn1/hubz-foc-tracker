"use client";

import { useState, useMemo } from "react";
import { InventoryItem } from "@/server/actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Smartphone, Search, CheckCircle2, Package } from "lucide-react";

interface ModelsTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
}

export function ModelsTab({ inventory, setSelectedItem }: ModelsTabProps) {
    const [modelSearch, setModelSearch] = useState("");
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const deviceModels = useMemo(() => {
        const groups: Record<string, typeof inventory> = {};
        for (const item of inventory) {
            if (!item.unitName || item.unitName.trim() === "-" || item.unitName.trim() === "N/A" || item.unitName.trim() === "") continue;

            const model = item.unitName.trim();
            if (!groups[model]) {
                groups[model] = [];
            }
            groups[model].push(item);
        }

        return Object.entries(groups).map(([name, items]) => {
            const available = items.filter(i => !!i.statusLocation?.toUpperCase().includes("AVAILABLE")).length;
            const loaned = items.filter(i => !!i.statusLocation?.toUpperCase().includes("LOANED")).length;
            const missing = items.filter(i => !!i.focStatus?.toUpperCase().includes("MISSING")).length;

            return {
                name,
                items,
                total: items.length,
                available,
                loaned,
                missing
            };
        }).sort((a, b) => b.total - a.total);
    }, [inventory]);

    const filteredModels = deviceModels.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()));
    const activeModelData = selectedModel ? deviceModels.find(m => m.name === selectedModel) : null;

    if (activeModelData) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setSelectedModel(null)}
                    className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white transition-colors text-sm font-medium bg-black/5 dark:bg-neutral-900/50 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 w-fit hover:bg-white/10"
                >
                    &larr; Back to Models
                </button>

                <div className="w-full bg-white/80 dark:bg-neutral-900/40 transition-colors border border-black/5 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                                <Smartphone className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors tracking-tight leading-loose mb-0.5">{activeModelData.name}</h2>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">Aggregated view of {activeModelData.total} units recorded.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1 text-xs">
                                {activeModelData.available} Available
                            </Badge>
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-3 py-1 text-xs">
                                {activeModelData.loaned} Loaned
                            </Badge>
                            {activeModelData.missing > 0 && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-xs">
                                    {activeModelData.missing} Missing
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                        {activeModelData.items.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedItem(item)}
                                className="group cursor-pointer flex flex-col gap-3 bg-white/80 dark:bg-neutral-950/40 transition-colors shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 rounded-2xl p-4 hover:bg-black/5 dark:hover:bg-neutral-800/50 hover:border-blue-500/30 transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="text-neutral-500 dark:text-neutral-400 text-xs font-mono mb-1 truncate">IMEI: {item.imei || "N/A"}</p>
                                        <h3 className="font-semibold text-neutral-200 text-sm truncate">{item.onHolder || "Unknown Holder"}</h3>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "px-2 py-0.5 text-[10px] whitespace-nowrap shrink-0 ml-2",
                                        item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                            item.statusLocation?.includes("LOANED / ON KOL") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20"
                                    )}>
                                        {item.statusLocation || "UNKNOWN"}
                                    </Badge>
                                </div>

                                {/* Extra details like Timestamp and Return Date */}
                                <div className="mt-1 pt-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5 text-xs">
                                    {(item.statusLocation?.includes("LOANED") || item.statusLocation?.includes("ON KOL")) && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-500">Request Date:</span>
                                            <span className="text-neutral-300 font-mono">{item.fullData?.["Step 3 Request Date"] || "-"}</span>
                                        </div>
                                    )}
                                    {(item.focStatus === 'RETURN' || item.focStatus === 'UNRETURN') && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-500">Target Return:</span>
                                            <span className={cn(
                                                "font-medium",
                                                item.plannedReturnDate === 'ASAP' ? "text-red-400" : "text-neutral-300"
                                            )}>{item.plannedReturnDate || "N/A"}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/80 dark:bg-neutral-900/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-xl w-full max-w-sm flex items-center focus-within:border-white/[0.15] transition-colors">
                <Search className="w-5 h-5 text-neutral-500 ml-3 shrink-0" />
                <Input
                    placeholder="Search Device Model..."
                    className="border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white placeholder:text-neutral-500 shadow-none"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                />
            </div>

            {filteredModels.length === 0 ? (
                <div className="text-center py-20 text-neutral-500">
                    <Smartphone className="w-12 h-12 text-neutral-700 mx-auto mb-4 opacity-50" />
                    <p>No Models found matching {modelSearch}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredModels.map((model, idx) => (
                        <div
                            key={idx}
                            onClick={() => setSelectedModel(model.name)}
                            className="group cursor-pointer bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.05] hover:border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl transition-all hover:bg-neutral-50 dark:hover:bg-white/5 hover:-translate-y-1 shadow-lg flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/20 to-cyan-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(37,99,235,0.1)] border border-blue-500/20">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500">
                                    {model.total}
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white truncate leading-tight mb-3" title={model.name}>{model.name}</h3>

                            <div className="mt-auto grid grid-cols-2 gap-2 text-xs font-medium">
                                <div className="flex flex-col gap-1 p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                                    <span className="text-neutral-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Stock</span>
                                    <span className="text-green-400 text-sm">{model.available}</span>
                                </div>
                                <div className="flex flex-col gap-1 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                                    <span className="text-neutral-500 flex items-center gap-1"><Package className="w-3 h-3 text-orange-500" /> Loaned</span>
                                    <span className="text-orange-400 text-sm">{model.loaned}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

