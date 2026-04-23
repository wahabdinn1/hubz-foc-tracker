"use client";

import React, { useState, useMemo, useCallback, useTransition, useRef, useEffect, memo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { InventoryItem } from "@/types/inventory";
import { MasterListPagination } from "./master-list/MasterListPagination";
import { isStatusAvailable, isStatusLoaned } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isItemOverdue } from "@/lib/date-utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, Smartphone } from "lucide-react";


interface MasterListTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    statusFilter: string;
    locationFilter: string;
}

function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
    callback: T,
    delay: number
) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const debounced = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => (callbackRef.current as T)(...args), delay);
    }, [delay]) as T & { cancel?: () => void };

    // eslint-disable-next-line react-hooks/immutability
    debounced.cancel = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    return debounced;
}



export const MasterListTab = memo(function MasterListTab({ 
    inventory, 
    setSelectedItem, 
    searchQuery,
    setSearchQuery,
    statusFilter,
    locationFilter,
}: MasterListTabProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [, startTransition] = useTransition();

    const urlSort = searchParams.get("sort") || "";
    const urlDir = searchParams.get("dir") || "";
    const urlPage = searchParams.get("page") || "";

    const initialSorting = useMemo<SortingState>(() => {
        if (urlSort && (urlDir === "asc" || urlDir === "desc")) {
            return [{ id: urlSort, desc: urlDir === "desc" }];
        }
        return [];
    }, [urlSort, urlDir]);

    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(() => {
        const p = parseInt(urlPage, 10);
        return p > 0 ? p : 1;
    });

    const syncUrl = useCallback((updates: Record<string, string | null>) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value === null || value === "") {
                    params.delete(key);
                } else {
                    params.set(key, value);
                }
            }
            const str = params.toString();
            router.replace(`${pathname}${str ? `?${str}` : ""}`, { scroll: false });
        });
    }, [searchParams, router, pathname]);

    const debouncedSyncSearch = useDebouncedCallback((query: string) => {
        syncUrl({ q: query || null, page: null });
    }, 300);


    const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
        const newSorting = typeof updater === "function" ? updater(sorting) : updater;
        setSorting(newSorting);
        const first = newSorting[0];
        syncUrl({
            sort: first?.id || null,
            dir: first ? (first.desc ? "desc" : "asc") : null,
            page: null,
        });
        setCurrentPage(1);
    }, [sorting, syncUrl]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        syncUrl({ page: page > 1 ? String(page) : null });
    }, [syncUrl]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, locationFilter]);

    useEffect(() => {
        return () => {
            if (debouncedSyncSearch) {
                (debouncedSyncSearch as unknown as { cancel?: () => void }).cancel?.();
            }
        };
    }, [debouncedSyncSearch]);

    const columns = useMemo<ColumnDef<InventoryItem, unknown>[]>(() => [
        {
            accessorKey: "unitName",
            header: "Unit Identity",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform shrink-0">
                        <Smartphone size={18} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-display leading-tight truncate">
                            {row.original.unitName || "-"}
                        </h4>
                        <span className="lg:hidden text-[10px] font-mono text-zinc-400 truncate block">
                            {row.original.imei || "-"}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "imei",
            header: "Serial / IMEI",
            cell: ({ row }) => (
                <div className="hidden lg:block">
                    <code className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-black/[0.03] dark:bg-white/[0.05] px-2 py-1 rounded-lg border border-black/[0.05] dark:border-white/[0.05] truncate block w-fit">
                        {row.original.imei || "-"}
                    </code>
                </div>
            ),
        },
        {
            accessorKey: "onHolder",
            header: "Custodian",
            cell: ({ row }) => (
                <div className="text-xs text-zinc-600 dark:text-zinc-300 font-medium truncate">
                    <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Holder</span>
                    {row.original.onHolder || "-"}
                </div>
            ),
        },
        {
            accessorKey: "goatPic",
            header: "GOAT PIC",
            cell: ({ row }) => {
                const pic = row.original.goatPic || row.original.seinPic;
                return (
                    <div className="flex items-center gap-2 truncate">
                        <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">PIC</span>
                        <div className="flex items-center gap-2">
                            {pic && pic !== "-" ? (
                                <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold shrink-0">
                                    {pic.substring(0, 2).toUpperCase()}
                                </div>
                            ) : null}
                            <span className="text-[11px] text-zinc-500 truncate">{pic || "-"}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "requestDate",
            header: "Log Date",
            accessorFn: (row) => row.step3Data?.timestamp || "",
            cell: ({ row }) => {
                const rd = row.original.step3Data?.timestamp;
                return (
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono font-bold truncate lg:text-right">
                        <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Date</span>
                        {rd && rd.trim() !== "" && rd !== "-" ? rd : "—"}
                    </div>
                );
            },
        },
        {
            accessorKey: "focStatus",
            header: "FOC Class",
            cell: ({ row }) => {
                const status = row.original.focStatus?.toUpperCase().trim() || "-";
                return (
                    <div className="lg:flex lg:justify-end">
                        <span className="lg:hidden text-[9px] uppercase font-black text-zinc-400 block mb-1">Class</span>
                        <div className={cn(
                            "w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            status === "RETURN" ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                                status === "UNRETURN" ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                                    "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                        )}>
                            {status === "-" ? "—" : status}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "statusLocation",
            header: "Vault Status",
            cell: ({ row }) => {
                const item = row.original;
                const isAvail = isStatusAvailable(item.statusLocation);
                const isLoaned = isStatusLoaned(item.statusLocation);
                const overdue = isItemOverdue(item);
                
                return (
                    <div className="flex items-center gap-2 lg:justify-end truncate">
                        <div className={cn(
                            "shrink-0 w-1.5 h-1.5 rounded-full",
                            isAvail ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" :
                            isLoaned ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" :
                            "bg-zinc-300 dark:bg-zinc-700",
                            overdue && "animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)] bg-red-500"
                        )} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isAvail ? "text-zinc-900 dark:text-white" :
                            isLoaned ? "text-orange-500" :
                            "text-zinc-500",
                            overdue && "text-red-500"
                        )}>
                            {item.statusLocation || "UNKNOWN"}
                        </span>
                    </div>
                );
            },
        },
    ], []);

    const filteredData = useMemo(() => {
        return inventory.filter(item => {
            const matchesStatus = statusFilter === "ALL" || (item.focStatus || "").toUpperCase().trim() === statusFilter;
            let matchesLocation = true;
            if (locationFilter !== "ALL") {
                if (locationFilter === "AVAILABLE") {
                    matchesLocation = isStatusAvailable(item.statusLocation);
                } else if (locationFilter === "LOANED") {
                    matchesLocation = isStatusLoaned(item.statusLocation);
                } else {
                    matchesLocation = !!item.statusLocation?.toUpperCase().includes(locationFilter);
                }
            }
            return matchesStatus && matchesLocation;
        });
    }, [inventory, statusFilter, locationFilter]);

    // Reset page to 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
        syncUrl({ page: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, locationFilter]);


    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            globalFilter: searchQuery,
            pagination: {
                pageIndex: Math.min(currentPage - 1, Math.max(0, Math.ceil(filteredData.length / rowsPerPage) - 1)),
                pageSize: rowsPerPage,
            },
        },
        onSortingChange: handleSortingChange,
        onGlobalFilterChange: setSearchQuery,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const query = String(filterValue).toLowerCase().trim();
            if (!query) return true;
            
            const item = row.original;
            const imei = (item.imei || "").toLowerCase();
            const unit = (item.unitName || "").toLowerCase();
            const holder = (item.onHolder || "").toLowerCase();
            
            return imei.includes(query) || unit.includes(query) || holder.includes(query);
        },
    });

    const filteredCount = filteredData.length;

    return (
        <div className="bg-white/80 dark:bg-neutral-900/40 border border-black/5 dark:border-white/[0.08] rounded-2xl md:rounded-3xl backdrop-blur-xl shadow-lg overflow-hidden">

            <div className="overflow-x-auto relative max-h-[calc(100vh-440px)] md:max-h-[600px] overflow-y-auto custom-scrollbar [content-visibility:auto]">
                <div className="w-full">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-30 px-6 py-4 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06]">
                        {table.getHeaderGroups().map(headerGroup => (
                            <div key={headerGroup.id} className="hidden lg:grid grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 items-center">
                                {headerGroup.headers.map(header => (
                                    <div
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className={cn(
                                            "text-[10px] font-black uppercase tracking-[0.2em] transition-colors select-none",
                                            header.column.getCanSort() ? "cursor-pointer text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white" : "text-zinc-400 dark:text-zinc-600",
                                            ["requestDate", "focStatus", "statusLocation"].includes(header.id) ? "text-right" : ""
                                        )}
                                    >
                                        <div className={cn("flex items-center gap-1", ["requestDate", "focStatus", "statusLocation"].includes(header.id) && "justify-end")}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() && (
                                                <span className="text-blue-500 text-[10px] ml-1">
                                                    {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <div className="lg:hidden flex justify-between items-center text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">
                            <span>Ledger Operations</span>
                            <span className="text-zinc-400 font-mono">{filteredCount} Assets</span>
                        </div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row, idx) => {
                                    const item = row.original;
                                    const overdue = isItemOverdue(item);
                                    return (
                                        <div
                                            key={`${item.imei}-${item.unitName}-${idx}`}
                                            onClick={() => setSelectedItem(item)}
                                            className={cn(
                                                "grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 items-center p-4 lg:px-6 lg:py-4 transition-colors cursor-pointer group",
                                                overdue ? "bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/30" : "hover:bg-blue-500/[0.03] dark:hover:bg-blue-500/[0.03]"
                                            )}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <div key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12">
                                    <EmptyState
                                        icon={Search}
                                        title="No devices found"
                                        description="We couldn't find any inventory matching your search or filter criteria."
                                    />
                                </div>
                            )}
                    </div>
                </div>
            </div>

            <MasterListPagination
                currentPage={Math.min(currentPage, table.getPageCount() || 1)}
                setCurrentPage={handlePageChange}
                totalPages={table.getPageCount()}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={(size: number) => {
                    setRowsPerPage(size);
                    setCurrentPage(1);
                    syncUrl({ page: null });
                }}
            />
        </div>
    );
});
