"use client";

import { useState } from "react";
import { InventoryItem } from "@/server/actions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Search,
    Filter,
    Package,
    ChevronLeft,
    ChevronRight,
    Smartphone,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion, AnimatePresence } from "framer-motion";

interface MasterListTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
}

export function MasterListTab({ inventory, setSelectedItem }: MasterListTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [locationFilter, setLocationFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem, direction: 'asc' | 'desc' } | null>(null);

    const filteredInventory = inventory.filter(item => {
        const query = searchQuery.toLowerCase();
        const matchesQuery = (
            (item.imei || "").toLowerCase().includes(query) ||
            (item.unitName || "").toLowerCase().includes(query) ||
            (item.onHolder || "").toLowerCase().includes(query)
        );

        const matchesStatus = statusFilter === "ALL" || (item.focStatus || "").toUpperCase().trim() === statusFilter;
        let matchesLocation = true;
        if (locationFilter !== "ALL") {
            if (locationFilter === "AVAILABLE") {
                matchesLocation = !!item.statusLocation?.toUpperCase().includes("AVAILABLE");
            } else if (locationFilter === "LOANED") {
                matchesLocation = !!item.statusLocation?.toUpperCase().includes("LOANED") || !!item.statusLocation?.toUpperCase().includes("ON KOL");
            } else {
                matchesLocation = !!item.statusLocation?.toUpperCase().includes(locationFilter);
            }
        }

        return matchesQuery && matchesStatus && matchesLocation;
    });

    const sortedInventory = [...filteredInventory].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        const aVal = String(a[key] || '').toLowerCase();
        const bVal = String(b[key] || '').toLowerCase();
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof InventoryItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const totalPages = Math.ceil(sortedInventory.length / rowsPerPage) || 1;
    const paginatedInventory = sortedInventory.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);

    return (
        <div className="border border-black/5 dark:border-white/[0.08] rounded-xl md:rounded-2xl bg-white/80 dark:bg-neutral-900/40 overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <Input
                            placeholder="Search by IMEI, Unit, or KOL..."
                            className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3 h-3 text-neutral-500" />
                                    <span className="truncate"><SelectValue placeholder="Status" /></span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="RETURN">Return</SelectItem>
                                <SelectItem value="UNRETURN">Unreturn</SelectItem>
                                <SelectItem value="MISSING">Missing</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                            <SelectTrigger className="w-[140px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3 h-3 text-neutral-500" />
                                    <span className="truncate"><SelectValue placeholder="Location" /></span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                                <SelectItem value="ALL">All Location</SelectItem>
                                <SelectItem value="AVAILABLE">Available</SelectItem>
                                <SelectItem value="LOANED">Loaned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="text-sm text-neutral-500 whitespace-nowrap hidden lg:block">
                    Showing {filteredInventory.length} results
                </div>
            </div>

            <div className="overflow-x-auto flex-1 relative max-h-[400px] md:max-h-[600px] overflow-y-auto custom-scrollbar">

                {/* Mobile Cards View */}
                <div className="block md:hidden p-3 space-y-3">
                    <AnimatePresence mode="popLayout">
                        {paginatedInventory.length > 0 ? (
                            paginatedInventory.map((item, idx) => {
                                const isOverdue = (() => {
                                    if (item.focStatus?.trim().toUpperCase() !== 'RETURN') return false;
                                    if (!item.statusLocation?.toUpperCase().includes('LOANED')) return false;
                                    if (!item.plannedReturnDate || item.plannedReturnDate === "N/A" || item.plannedReturnDate === "ASAP") return false;
                                    const returnDate = new Date(item.plannedReturnDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return !isNaN(returnDate.getTime()) && returnDate < today;
                                })();

                                return (
                                    <motion.div
                                        key={item.imei || item.unitName || idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.15, delay: Math.min(idx * 0.05, 0.3) }}
                                        onClick={() => setSelectedItem(item)}
                                        className={cn(
                                            "flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all shadow-sm",
                                            isOverdue ? "bg-red-50 dark:bg-red-950/20 border-red-500/30" : "bg-white dark:bg-neutral-900 border-black/5 dark:border-white/[0.05]"
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
                                                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest mb-0.5">Target Return</span>
                                                <span className={cn("font-medium text-xs font-mono", isOverdue ? "text-red-500" : "text-neutral-700 dark:text-neutral-300")}>{item.plannedReturnDate || "-"}</span>
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

                <table className="hidden md:table w-full text-sm text-left border-collapse">
                    <thead className="text-xs uppercase bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20 shadow-md">
                        <tr>
                            <th onClick={() => handleSort('unitName')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:hover:text-white group">
                                <div className="flex items-center gap-1">Unit Name {sortConfig?.key === 'unitName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th onClick={() => handleSort('imei')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:hover:text-white group whitespace-nowrap">
                                <div className="flex items-center gap-1">IMEI {sortConfig?.key === 'imei' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th onClick={() => handleSort('onHolder')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:hover:text-white group">
                                <div className="flex items-center gap-1">Holder {sortConfig?.key === 'onHolder' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th className="px-5 py-4 font-semibold tracking-wider whitespace-nowrap">GOAT PIC</th>
                            <th className="px-5 py-4 font-semibold tracking-wider whitespace-nowrap">Request Date</th>
                            <th onClick={() => handleSort('plannedReturnDate')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:hover:text-white group whitespace-nowrap">
                                <div className="flex items-center gap-1">Target Return {sortConfig?.key === 'plannedReturnDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                            </th>
                            <th onClick={() => handleSort('statusLocation')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:hover:text-white group text-right">
                                <div className="flex items-center justify-end gap-1">Status {sortConfig?.key === 'statusLocation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/50">
                        <AnimatePresence mode="popLayout">
                            {paginatedInventory.length > 0 ? (
                                paginatedInventory.map((item, idx) => {
                                    const isOverdue = (() => {
                                        if (item.focStatus?.trim().toUpperCase() !== 'RETURN') return false;
                                        if (!item.statusLocation?.toUpperCase().includes('LOANED')) return false;
                                        if (!item.plannedReturnDate || item.plannedReturnDate === "N/A" || item.plannedReturnDate === "ASAP") return false;
                                        const returnDate = new Date(item.plannedReturnDate);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return !isNaN(returnDate.getTime()) && returnDate < today;
                                    })();

                                    return (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.15, delay: Math.min(idx * 0.05, 0.3) }}
                                            key={item.imei || item.unitName || idx}
                                            onClick={() => setSelectedItem(item)}
                                            className={cn(
                                                "transition-colors group cursor-pointer",
                                                isOverdue ? "bg-red-950/20 hover:bg-red-900/30 border-l-[3px] border-l-orange-500" : "hover:bg-neutral-50 dark:hover:bg-white/5 border-l-[3px] border-l-transparent"
                                            )}
                                        >
                                            <td className="px-5 py-4 font-medium text-neutral-900 dark:text-neutral-200 group-hover:text-blue-400 whitespace-nowrap">{item.unitName || "-"}</td>
                                            <td className="px-5 py-4 text-neutral-500 dark:text-neutral-400 font-mono text-xs whitespace-nowrap">{item.imei || "-"}</td>
                                            <td className="px-5 py-4 text-neutral-700 dark:text-neutral-300 min-w-[150px]">{item.onHolder || "-"}</td>
                                            <td className="px-5 py-4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{item.goatPic || item.fullData?.["PIC Request"] || "-"}</td>
                                            <td className="px-5 py-4 text-neutral-500 text-xs font-mono">{item.fullData?.["Step 3 Request Date"] || "-"}</td>
                                            <td className="px-5 py-4 font-mono text-xs text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                                {item.plannedReturnDate === 'ASAP' ? <span className="text-red-400 font-bold">ASAP</span> : item.plannedReturnDate || "-"}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Badge variant="outline" className={cn(
                                                    item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                        item.statusLocation?.includes("LOANED / ON KOL") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                            "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20",
                                                    isOverdue && "border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                                                )}>
                                                    {item.statusLocation || "UNKNOWN"}
                                                </Badge>
                                            </td>
                                        </motion.tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-0 py-8">
                                        <EmptyState
                                            icon={Search}
                                            title="No devices found"
                                            description="We couldn't find any inventory matching your search or filter criteria."
                                        />
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Select
                        value={String(rowsPerPage)}
                        onValueChange={(val) => {
                            setRowsPerPage(Number(val));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[110px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                            <SelectValue placeholder="10 rows" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                            <SelectItem value="10">10 rows</SelectItem>
                            <SelectItem value="20">20 rows</SelectItem>
                            <SelectItem value="50">50 rows</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                        Page <span className="text-neutral-900 dark:text-white font-medium">{currentPage}</span> of <span className="font-medium text-neutral-900 dark:text-white">{totalPages}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white focus-visible:ring-blue-500 text-neutral-500 dark:text-neutral-300"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white focus-visible:ring-blue-500 text-neutral-500 dark:text-neutral-300"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
