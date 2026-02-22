"use client";

import { useState, useMemo } from "react";
import { InventoryItem } from "../../server/actions";
import { Search, User, Phone, MapPin, Package, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";

export function KOLClient({ inventory }: { inventory: InventoryItem[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKOL, setSelectedKOL] = useState<string | null>(null);

    // Group inventory by KOL
    const kolData = useMemo(() => {
        const groups: Record<string, typeof inventory> = {};
        for (const item of inventory) {
            if (!item.onHolder || item.onHolder.trim() === "-" || item.onHolder.trim() === "N/A" || item.onHolder.trim() === "") continue;

            const kol = item.onHolder.trim();
            if (!groups[kol]) {
                groups[kol] = [];
            }
            groups[kol].push(item);
        }

        return Object.entries(groups).map(([name, items]) => {
            const activeItems = items.filter(i => !!i.statusLocation?.toUpperCase().includes("LOANED") || i.focStatus?.toUpperCase() === "RETURN");
            const totalItems = items.length;

            // Try to extract basic info from the latest item
            const latestInfo = items[items.length - 1]?.fullData || {};
            const phone = latestInfo["KOL Phone Number"] || latestInfo["Phone Number"] || "-";
            const address = latestInfo["KOL Address"] || latestInfo["Address"] || "-";

            return {
                name,
                items,
                activeCount: activeItems.length,
                totalItems,
                phone,
                address
            };
        }).sort((a, b) => b.activeCount - a.activeCount);
    }, [inventory]);

    const filteredKOLs = kolData.filter(k => k.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const activeKOLData = selectedKOL ? kolData.find(k => k.name === selectedKOL) : null;

    if (activeKOLData) {
        return (
            <div className="w-full h-full space-y-8 pb-10 p-6 md:p-10">
                <button
                    onClick={() => setSelectedKOL(null)}
                    className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium bg-black/5 dark:bg-neutral-900/50 transition-colors px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 transition-colors w-fit"
                >
                    &larr; Back to Directory
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* KOL Profile Sidebar */}
                    <div className="w-full md:w-80 shrink-0 bg-neutral-900/40 border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
                                <User className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors tracking-tight leading-tight mb-1">{activeKOLData.name}</h1>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{activeKOLData.activeCount} Active Devices</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <Phone className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                                <span className="text-neutral-300 break-all">{activeKOLData.phone}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                                <span className="text-neutral-300">{activeKOLData.address}</span>
                            </div>
                        </div>
                    </div>

                    {/* Devices List */}
                    <div className="flex-1 w-full bg-neutral-900/40 border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col min-h-[500px]">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white transition-colors mb-6 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            Device History ({activeKOLData.totalItems})
                        </h2>

                        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {activeKOLData.items.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 dark:bg-neutral-950/40 transition-colors shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 transition-colors rounded-2xl p-4 hover:bg-black/5 dark:hover:bg-neutral-800/50 transition-colors transition-colors">
                                    <div>
                                        <h3 className="font-semibold text-neutral-200">{item.unitName}</h3>
                                        <p className="text-neutral-500 text-xs font-mono mt-0.5">IMEI: {item.imei || "N/A"}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className={cn(
                                            "px-2.5 py-1 text-xs whitespace-nowrap",
                                            item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                item.statusLocation?.includes("LOANED / ON KOL") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                    "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20"
                                        )}>
                                            {item.statusLocation || "UNKNOWN"}
                                        </Badge>
                                        <div className="text-right text-xs text-neutral-500 w-24">
                                            {item.focStatus}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full space-y-8 pb-10 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors mb-1">
                        KOL Directory
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Aggregated profiles of all Key Opinion Leaders based on device tracking.</p>
                </div>

                <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-900/40 transition-colors p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] transition-colors backdrop-blur-xl shadow-xl">
                    <ThemeToggle />
                </div>
            </div>

            <div className="relative z-10">
                <div className="bg-neutral-900/40 p-1.5 rounded-2xl border border-white/[0.05] backdrop-blur-xl shadow-xl w-full max-w-sm mb-6 flex items-center transition-colors focus-within:border-white/[0.15]">
                    <Search className="w-5 h-5 text-neutral-500 ml-3 shrink-0" />
                    <Input
                        placeholder="Search KOL name..."
                        className="border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white transition-colors placeholder:text-neutral-500 shadow-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredKOLs.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        <User className="w-12 h-12 text-neutral-700 mx-auto mb-4 opacity-50" />
                        <p>No KOLs found matching {searchQuery}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredKOLs.map((kol, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedKOL(kol.name)}
                                className="group cursor-pointer bg-neutral-900/40 border border-white/[0.05] hover:border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl transition-all hover:bg-neutral-800/60 hover:-translate-y-1 shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(37,99,235,0.1)] border border-blue-500/20">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "px-2 shadow-sm font-medium",
                                        kol.activeCount > 0 ? "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]" : "bg-neutral-800 text-neutral-500 border-none shadow-none"
                                    )}>
                                        {kol.activeCount} active
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-lg text-neutral-900 dark:text-white transition-colors truncate leading-tight mb-1" title={kol.name}>{kol.name}</h3>
                                <p className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
                                    <Package className="w-3.5 h-3.5 opacity-70" />
                                    {kol.totalItems} Total Devices Handled
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
