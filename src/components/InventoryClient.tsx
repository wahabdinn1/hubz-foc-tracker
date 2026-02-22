"use client";

import { useState, useMemo, useTransition } from "react";
import { InventoryItem, revalidateInventory } from "../../server/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickViewPanel } from "./QuickViewPanel";
import { ThemeToggle } from "./ThemeToggle";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Package,
    Search,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Filter,
    Smartphone,
    Database,
    AlertCircle,
    CheckCircle2
} from "lucide-react";

export function InventoryClient({ inventory }: { inventory: InventoryItem[] }) {
    // Shared State
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isPending, startTransition] = useTransition();

    // Tab 1: Master Setup (Data Table) State
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [locationFilter, setLocationFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem, direction: 'asc' | 'desc' } | null>(null);

    // Tab 2: Aggregator State
    const [modelSearch, setModelSearch] = useState("");
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const handleSync = () => {
        startTransition(async () => {
            const res = await revalidateInventory();
            if (res.success) {
                toast.success("Inventory synchronized with Google Sheets");
            } else {
                toast.error("Failed to sync inventory");
            }
        });
    };

    // --- LOGIC FOR TAB 1: MASTER LIST ---
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
    if (currentPage > totalPages) setCurrentPage(1);

    // --- LOGIC FOR TAB 2: DEVICE MODELS ---
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

    return (
        <div className="w-full h-full space-y-6 pb-10 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white transition-colors mb-1">
                        Inventory Bank
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Deeply manage and aggregate the hardware lifecycle.</p>
                </div>

                <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-900/40 transition-colors p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] transition-colors backdrop-blur-xl shadow-xl">
                    <ThemeToggle />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSync}
                        disabled={isPending}
                        className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white transition-colors hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors rounded-xl transition-colors"
                        title="Force Sync with Google Sheets"
                    >
                        <RefreshCw className={cn("w-5 h-5", isPending && "animate-spin text-blue-400")} />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="models" className="w-full relative z-10">
                <TabsList className="bg-black/5 dark:bg-neutral-900/50 transition-colors border border-black/5 dark:border-white/[0.05] transition-colors p-1 h-auto rounded-2xl mb-6">
                    <TabsTrigger value="models" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-6 py-2.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-white/10 hover:text-neutral-200">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4" />
                            Device Models
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="master" className="rounded-xl data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_0_15px_rgba(37,99,235,0.1)] transition-all px-6 py-2.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-white/10 hover:text-neutral-200">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Master List
                        </div>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 2: DEVICE MODELS */}
                <TabsContent value="models" className="m-0 focus-visible:ring-0">
                    {activeModelData ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button
                                onClick={() => setSelectedModel(null)}
                                className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white transition-colors transition-colors text-sm font-medium bg-black/5 dark:bg-neutral-900/50 transition-colors px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5 transition-colors w-fit hover:bg-white/10"
                            >
                                &larr; Back to Models
                            </button>

                            <div className="w-full bg-white/80 dark:bg-neutral-900/40 transition-colors border border-black/5 dark:border-white/[0.08] transition-colors rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex flex-col min-h-[500px]">
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
                                            className="group cursor-pointer flex flex-col gap-3 bg-white/80 dark:bg-neutral-950/40 transition-colors shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 transition-colors rounded-2xl p-4 hover:bg-black/5 dark:hover:bg-neutral-800/50 transition-colors hover:border-blue-500/30 transition-all hover:-translate-y-0.5"
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
                                            <div className="mt-1 pt-3 border-t border-black/5 dark:border-white/5 transition-colors flex flex-col gap-1.5 text-xs">
                                                {(item.statusLocation?.includes("LOANED") || item.statusLocation?.includes("ON KOL")) && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-neutral-500">Requested:</span>
                                                        <span className="text-neutral-300 font-mono">{item.fullData?.["Timestamp"] || item.fullData?.["Date Received"] || item.fullData?.["Request Date"] || "-"}</span>
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
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-white/80 dark:bg-neutral-900/40 transition-colors p-1.5 rounded-2xl border border-black/5 dark:border-white/[0.05] transition-colors backdrop-blur-xl shadow-xl w-full max-w-sm flex items-center transition-colors focus-within:border-white/[0.15]">
                                <Search className="w-5 h-5 text-neutral-500 ml-3 shrink-0" />
                                <Input
                                    placeholder="Search Device Model..."
                                    className="border-none bg-transparent focus-visible:ring-0 text-neutral-900 dark:text-white transition-colors placeholder:text-neutral-500 shadow-none"
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
                                            className="group cursor-pointer bg-white/80 dark:bg-neutral-900/40 transition-colors border border-black/5 dark:border-white/[0.05] transition-colors hover:border-blue-500/30 rounded-2xl p-5 backdrop-blur-xl transition-all hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors hover:-translate-y-1 shadow-lg flex flex-col"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/20 to-cyan-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(37,99,235,0.1)] border border-blue-500/20">
                                                    <Smartphone className="w-6 h-6" />
                                                </div>
                                                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500">
                                                    {model.total}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-lg text-neutral-900 dark:text-white transition-colors truncate leading-tight mb-3" title={model.name}>{model.name}</h3>

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
                    )}
                </TabsContent>

                {/* TAB 1: MASTER LIST */}
                <TabsContent value="master" className="m-0 focus-visible:ring-0 animate-in fade-in duration-500">
                    <div className="border border-black/5 dark:border-white/[0.08] transition-colors rounded-2xl bg-white/80 dark:bg-neutral-900/40 transition-colors overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                    <Input
                                        placeholder="Search by IMEI, Unit, or KOL..."
                                        className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 transition-colors focus-visible:ring-blue-500 pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[140px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Filter className="w-3 h-3 text-neutral-500" />
                                                <span className="truncate"><SelectValue placeholder="Status" /></span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                            <SelectItem value="ALL">All Status</SelectItem>
                                            <SelectItem value="RETURN">Return</SelectItem>
                                            <SelectItem value="UNRETURN">Unreturn</SelectItem>
                                            <SelectItem value="MISSING">Missing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                                        <SelectTrigger className="w-[140px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Filter className="w-3 h-3 text-neutral-500" />
                                                <span className="truncate"><SelectValue placeholder="Location" /></span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
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

                        <div className="overflow-x-auto flex-1 relative max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 transition-colors sticky top-0 z-20 shadow-md">
                                    <tr>
                                        <th onClick={() => handleSort('unitName')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:text-white transition-colors transition-colors group">
                                            <div className="flex items-center gap-1">Unit Name {sortConfig?.key === 'unitName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => handleSort('imei')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:text-white transition-colors transition-colors group whitespace-nowrap">
                                            <div className="flex items-center gap-1">IMEI {sortConfig?.key === 'imei' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => handleSort('onHolder')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:text-white transition-colors transition-colors group">
                                            <div className="flex items-center gap-1">Holder {sortConfig?.key === 'onHolder' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold tracking-wider whitespace-nowrap">GOAT PIC</th>
                                        <th className="px-5 py-4 font-semibold tracking-wider whitespace-nowrap">Request Date</th>
                                        <th onClick={() => handleSort('plannedReturnDate')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:text-white transition-colors transition-colors group whitespace-nowrap">
                                            <div className="flex items-center gap-1">Target Return {sortConfig?.key === 'plannedReturnDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                        </th>
                                        <th onClick={() => handleSort('statusLocation')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:text-white transition-colors transition-colors group text-right">
                                            <div className="flex items-center justify-end gap-1">Status {sortConfig?.key === 'statusLocation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/50">
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
                                                <tr
                                                    key={idx}
                                                    onClick={() => setSelectedItem(item)}
                                                    className={cn(
                                                        "transition-colors group cursor-pointer",
                                                        isOverdue ? "bg-red-950/20 hover:bg-red-900/30 border-l-[3px] border-l-orange-500" : "hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors border-l-[3px] border-l-transparent"
                                                    )}
                                                >
                                                    <td className="px-5 py-4 font-medium text-neutral-900 dark:text-neutral-200 transition-colors group-hover:text-blue-400 transition-colors whitespace-nowrap">{item.unitName || "-"}</td>
                                                    <td className="px-5 py-4 text-neutral-500 dark:text-neutral-400 font-mono text-xs whitespace-nowrap">{item.imei || "-"}</td>
                                                    <td className="px-5 py-4 text-neutral-700 dark:text-neutral-300 transition-colors min-w-[150px]">{item.onHolder || "-"}</td>
                                                    <td className="px-5 py-4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{item.goatPic || item.fullData?.["PIC Request"] || "-"}</td>
                                                    <td className="px-5 py-4 text-neutral-500 text-xs font-mono">{item.fullData?.["Timestamp"] || item.fullData?.["Date Received"] || item.fullData?.["Request Date"] || "-"}</td>
                                                    <td className="px-5 py-4 font-mono text-xs text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap">
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
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Package className="w-8 h-8 opacity-20" />
                                                    <p>No inventory data found.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-neutral-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Select
                                    value={String(rowsPerPage)}
                                    onValueChange={(val) => {
                                        setRowsPerPage(Number(val));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[110px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                        <SelectValue placeholder="10 rows" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                        <SelectItem value="10">10 rows</SelectItem>
                                        <SelectItem value="20">20 rows</SelectItem>
                                        <SelectItem value="50">50 rows</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                                    Page <span className="text-neutral-900 dark:text-white transition-colors font-medium">{currentPage}</span> of <span className="font-medium text-neutral-900 dark:text-white transition-colors">{totalPages}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 transition-colors hover:bg-white/10 hover:text-neutral-900 dark:text-white transition-colors focus-visible:ring-blue-500 text-neutral-300"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 transition-colors hover:bg-white/10 hover:text-neutral-900 dark:text-white transition-colors focus-visible:ring-blue-500 text-neutral-300"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <QuickViewPanel
                item={selectedItem}
                isOpen={!!selectedItem}
                onOpenChange={(open) => !open && setSelectedItem(null)}
            />
        </div>
    );
}
