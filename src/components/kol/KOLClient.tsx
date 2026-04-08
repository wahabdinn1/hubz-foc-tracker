"use client";

import { useState, useMemo } from "react";
import type { InventoryItem } from "@/types/inventory";
import { Search, User, Phone, MapPin, Package, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuickViewPanel } from "@/components/shared/QuickViewPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { useInventoryStats } from "@/hooks/useInventoryStats";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function KOLClient({ inventory }: { inventory: InventoryItem[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKOL, setSelectedKOL] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const { availableUnits, loanedItems } = useInventoryStats(inventory);

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
    const totalPages = Math.ceil(filteredKOLs.length / ITEMS_PER_PAGE);
    const paginatedKOLs = Math.max(1, currentPage) > totalPages 
        ? filteredKOLs.slice(0, ITEMS_PER_PAGE) // fallback if page is out of bounds
        : filteredKOLs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const activeKOLData = selectedKOL ? kolData.find(k => k.name === selectedKOL) : null;

    if (activeKOLData) {
        const profileHash = activeKOLData.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const profileHue = profileHash % 360;
        const profileInitials = activeKOLData.name.split(/\s+/).map(w => w[0]?.toUpperCase()).join("").slice(0, 2);

        return (
            <div className="w-full h-full space-y-6 md:space-y-8 pb-10 p-4 md:p-10">
                <button
                    onClick={() => setSelectedKOL(null)}
                    className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm font-medium bg-black/5 dark:bg-neutral-900/50 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 w-fit"
                >
                    &larr; Back to Directory
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* KOL Profile Sidebar */}
                    <div className="w-full md:w-80 shrink-0 bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-4 md:gap-6">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 dark:border-white/10 shrink-0"
                                style={{ background: `linear-gradient(135deg, hsl(${profileHue}, 60%, 65%), hsl(${(profileHue + 40) % 360}, 50%, 55%))` }}
                            >
                                <span className="text-white font-bold text-xl tracking-wide">{profileInitials}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors tracking-tight leading-tight mb-1">{activeKOLData.name}</h1>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">{activeKOLData.activeCount} Active Devices</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-sm">
                                <Phone className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                                <span className="text-neutral-700 dark:text-neutral-300 break-all">{activeKOLData.phone}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                                <span className="text-neutral-700 dark:text-neutral-300">{activeKOLData.address}</span>
                            </div>
                        </div>
                    </div>

                    {/* Devices List */}
                    <div className="flex-1 w-full bg-neutral-50 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl p-4 md:p-6 backdrop-blur-xl shadow-2xl flex flex-col min-h-[400px] md:min-h-[500px]">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white transition-colors mb-6 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            Device History ({activeKOLData.totalItems})
                        </h2>

                        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 overflow-x-hidden">
                            <AnimatePresence mode="popLayout">
                                {activeKOLData.items.map((item, idx) => (
                                    <motion.div key={item.imei || item.unitName || idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.15, delay: Math.min(idx * 0.05, 0.3) }}
                                        onClick={() => setSelectedItem(item)}
                                        className="cursor-pointer flex flex-col gap-3 bg-white/80 dark:bg-neutral-950/40 transition-all shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 hover:bg-black/5 dark:hover:bg-neutral-800/50 hover:border-blue-500/30"
                                    >
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{item.unitName}</h3>
                                            <p className="text-neutral-500 text-xs font-mono mt-0.5 truncate">IMEI: {item.imei || "N/A"}</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className={cn(
                                                "px-2 py-0.5 text-[10px] sm:text-xs whitespace-nowrap",
                                                item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    item.statusLocation?.includes("LOANED / ON KOL") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                        "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20"
                                            )}>
                                                {item.statusLocation || "UNKNOWN"}
                                            </Badge>
                                            {item.focStatus && (
                                                <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">
                                                    {item.focStatus}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <QuickViewPanel
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full space-y-8 pb-10 p-6 md:p-10">
            {/* Header */}
            <PageHeader
                title="KOL Directory"
                subtitle="Aggregated profiles of all Key Opinion Leaders based on device tracking."
                availableUnits={availableUnits}
                loanedItems={loanedItems}
                allInventory={inventory}
            />

            <div className="relative z-10">
                <div className="bg-white/80 dark:bg-neutral-900/40 transition-colors p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] backdrop-blur-xl shadow-xl w-full max-w-sm mb-6 flex items-center focus-within:border-black/20 dark:focus-within:border-white/[0.15]">
                    <Search className="w-5 h-5 text-neutral-500 ml-3 shrink-0" />
                    <Input
                        placeholder="Search KOL name..."
                        className="border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white transition-colors placeholder:text-neutral-500 shadow-none"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                {filteredKOLs.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={Search}
                            title="No KOLs Found"
                            description={`We couldn't find any Key Opinion Leaders matching "${searchQuery}".`}
                        />
                    </div>
                ) : (
                    <>
                        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                            <AnimatePresence mode="popLayout">
                                {paginatedKOLs.map((kol, idx) => {
                                    // Deterministic color from name hash
                                    const hash = kol.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                                    const hue = hash % 360;
                                    const initials = kol.name.split(/\s+/).map(w => w[0]?.toUpperCase()).join("").slice(0, 2);
                                    const latestDevice = kol.items[kol.items.length - 1]?.unitName;

                                    return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.2) }}
                                        key={kol.name}
                                        onClick={() => setSelectedKOL(kol.name)}
                                        className="group cursor-pointer bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.05] hover:border-blue-500/30 rounded-xl md:rounded-2xl p-4 md:p-5 backdrop-blur-xl transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:-translate-y-1 shadow-lg"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            {/* Avatar with unique color */}
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-md border border-white/20 dark:border-white/10"
                                                style={{
                                                    background: `linear-gradient(135deg, hsl(${hue}, 60%, 65%), hsl(${(hue + 40) % 360}, 50%, 55%))`,
                                                }}
                                            >
                                                <span className="text-white font-bold text-sm tracking-wide">{initials}</span>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "px-2 shadow-sm font-medium text-xs",
                                                kol.activeCount > 0
                                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}>
                                                {kol.activeCount > 0 ? `${kol.activeCount} active` : "All returned"}
                                            </Badge>
                                        </div>
                                        <h3 className="font-bold text-lg text-neutral-900 dark:text-white transition-colors truncate leading-tight mb-1" title={kol.name}>{kol.name}</h3>
                                        <p className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
                                            <Package className="w-3.5 h-3.5 opacity-70" />
                                            {kol.totalItems} Total Devices Handled
                                        </p>
                                        {latestDevice && (
                                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2 truncate flex items-center gap-1">
                                                <Smartphone className="w-3 h-3 shrink-0" />
                                                Latest: {latestDevice}
                                            </p>
                                        )}
                                    </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white/50 dark:bg-neutral-900/40 p-4 rounded-xl border border-black/5 dark:border-white/[0.05]">
                                <p className="text-sm text-neutral-500 text-center sm:text-left">
                                    Showing <span className="font-medium text-neutral-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-neutral-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredKOLs.length)}</span> of <span className="font-medium text-neutral-900 dark:text-white">{filteredKOLs.length}</span> KOLs
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm font-medium px-3 text-neutral-600 dark:text-neutral-300">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
