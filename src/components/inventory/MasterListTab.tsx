"use client";

import { useState, useMemo, useCallback, useTransition, useRef, useEffect } from "react";
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
import { MasterListFilters } from "./master-list/MasterListFilters";
import { MasterListMobileCards } from "./master-list/MasterListMobileCards";
import { MasterListPagination } from "./master-list/MasterListPagination";
import { isStatusAvailable, isStatusLoaned } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isItemOverdue } from "@/lib/date-utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MasterListTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
    initialFilter?: string;
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

export function MasterListTab({ inventory, setSelectedItem, initialFilter }: MasterListTabProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [, startTransition] = useTransition();

    const urlQ = searchParams.get("q") || "";
    const urlSort = searchParams.get("sort") || "";
    const urlDir = searchParams.get("dir") || "";
    const urlPage = searchParams.get("page") || "";

    const [globalFilter, setGlobalFilter] = useState(urlQ);
    const [statusFilter, setStatusFilter] = useState(() => {
        if (initialFilter === "unreturn") return "UNRETURN";
        return "ALL";
    });
    const [locationFilter, setLocationFilter] = useState(() => {
        if (initialFilter === "available") return "AVAILABLE";
        if (initialFilter === "loaned") return "LOANED";
        return "ALL";
    });

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

    const handleSearchChange = useCallback((value: string) => {
        setGlobalFilter(value);
        setCurrentPage(1);
        debouncedSyncSearch(value);
    }, [debouncedSyncSearch]);

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
        return () => {
            if (debouncedSyncSearch) {
                (debouncedSyncSearch as unknown as { cancel?: () => void }).cancel?.();
            }
        };
    }, [debouncedSyncSearch]);

    const columns = useMemo<ColumnDef<InventoryItem, unknown>[]>(() => [
        {
            accessorKey: "unitName",
            header: "Unit Name",
            cell: ({ row }) => (
                <span className="font-medium text-neutral-900 dark:text-neutral-200 group-hover:text-blue-400 truncate">
                    {row.original.unitName || "-"}
                </span>
            ),
        },
        {
            accessorKey: "imei",
            header: "IMEI",
            cell: ({ row }) => (
                <span className="text-neutral-500 dark:text-neutral-400 font-mono text-xs truncate">
                    {row.original.imei || "-"}
                </span>
            ),
        },
        {
            accessorKey: "onHolder",
            header: "Holder",
            cell: ({ row }) => (
                <span className="text-neutral-700 dark:text-neutral-300 truncate">
                    {row.original.onHolder || "-"}
                </span>
            ),
        },
        {
            accessorKey: "goatPic",
            header: "GOAT PIC",
            cell: ({ row }) => (
                <span className="text-neutral-500 dark:text-neutral-400 truncate">
                    {row.original.goatPic || row.original.step1Data?.seinPicName || "-"}
                </span>
            ),
        },
        {
            id: "requestDate",
            header: "Request Date",
            accessorFn: (row) => row.step3Data?.timestamp || "",
            cell: ({ row }) => {
                const rd = row.original.step3Data?.timestamp;
                return rd && rd.trim() !== "" && rd !== "-"
                    ? <span className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm truncate">{rd}</span>
                    : <span className="text-neutral-300 dark:text-neutral-600 italic text-xs md:text-sm">—</span>;
            },
        },
        {
            accessorKey: "focStatus",
            header: "FOC Status",
            cell: ({ row }) => {
                const status = row.original.focStatus?.toUpperCase().trim();
                if (!status || status === "-") return <span className="text-neutral-300 dark:text-neutral-600 italic text-xs">—</span>;
                return (
                    <Badge variant="outline" className={cn(
                        "text-[10px] md:text-[11px] font-semibold shrink-0",
                        status === "RETURN" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            status === "UNRETURN" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                    )}>
                        {row.original.focStatus}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "statusLocation",
            header: "Status",
            cell: ({ row }) => {
                const item = row.original;
                const overdue = isItemOverdue(item);
                return (
                    <div className="text-right">
                        <Badge variant="outline" className={cn(
                            "shrink-0 text-[10px] md:text-[11px]",
                            isStatusAvailable(item.statusLocation) ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                isStatusLoaned(item.statusLocation) ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20",
                            overdue && "border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                        )}>
                            {item.statusLocation || "UNKNOWN"}
                        </Badge>
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
            globalFilter,
            pagination: {
                pageIndex: Math.min(currentPage - 1, Math.max(0, Math.ceil(filteredData.length / rowsPerPage) - 1)),
                pageSize: rowsPerPage,
            },
        },
        onSortingChange: handleSortingChange,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            const query = String(filterValue).toLowerCase();
            const item = row.original;
            return (
                (item.imei || "").toLowerCase().includes(query) ||
                (item.unitName || "").toLowerCase().includes(query) ||
                (item.onHolder || "").toLowerCase().includes(query)
            );
        },
    });

    const filteredCount = filteredData.length;

    return (
        <div className="border border-black/5 dark:border-white/[0.08] rounded-xl md:rounded-2xl bg-white/80 dark:bg-neutral-900/40 overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
            <MasterListFilters
                searchQuery={globalFilter}
                setSearchQuery={handleSearchChange}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                filteredCount={filteredCount}
            />

            <div className="overflow-x-auto flex-1 relative max-h-[calc(100vh-280px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                <MasterListMobileCards
                    paginatedInventory={table.getRowModel().rows.map(r => r.original)}
                    setSelectedItem={setSelectedItem}
                />

                <table className="hidden lg:table w-full text-sm text-left border-collapse">
                     <thead className="text-xs uppercase bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20 shadow-md">
                         {table.getHeaderGroups().map(headerGroup => (
                             <tr key={headerGroup.id}>
                                 {headerGroup.headers.map(header => (
                                     <th
                                         key={header.id}
                                         onClick={header.column.getToggleSortingHandler()}
                                         className={cn(
                                             "px-3 py-3 md:px-5 md:py-4 font-semibold tracking-wider",
                                             header.column.getCanSort() ? "cursor-pointer hover:text-neutral-900 dark:hover:text-white" : "",
                                             header.id === "statusLocation" ? "text-right" : "",
                                             ["imei", "focStatus", "goatPic", "requestDate"].includes(header.id) ? "whitespace-nowrap" : ""
                                         )}
                                     >
                                         <div className={cn("flex items-center gap-1", header.id === "statusLocation" && "justify-end")}>
                                             {flexRender(header.column.columnDef.header, header.getContext())}
                                             {header.column.getIsSorted() && (
                                                 <span className="text-blue-500 text-xs md:text-sm">
                                                     {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                                                 </span>
                                             )}
                                         </div>
                                     </th>
                                 ))}
                             </tr>
                         ))}
                     </thead>
                     <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/50">
                         <AnimatePresence mode="popLayout">
                             {table.getRowModel().rows.length > 0 ? (
                                 table.getRowModel().rows.map((row, idx) => {
                                     const item = row.original;
                                     const overdue = isItemOverdue(item);
                                     return (
                                         <motion.tr
                                             initial={{ opacity: 0, y: 10 }}
                                             animate={{ opacity: 1, y: 0 }}
                                             exit={{ opacity: 0, y: -10 }}
                                             transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.15) }}
                                             key={`${item.imei}-${item.unitName}-${idx}`}
                                             onClick={() => setSelectedItem(item)}
                                             className={cn(
                                                 "transition-colors group cursor-pointer min-h-[60px] md:min-h-0",
                                                 overdue ? "bg-red-950/20 hover:bg-red-900/30 border-l-[3px] border-l-orange-500" : "hover:bg-neutral-50 dark:hover:bg-white/5 border-l-[3px] border-l-transparent"
                                             )}
                                         >
                                             {row.getVisibleCells().map(cell => (
                                                 <td key={cell.id} className="px-3 py-3 md:px-5 md:py-4">
                                                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                 </td>
                                             ))}
                                         </motion.tr>
                                     );
                                 })
                             ) : (
                                 <tr>
                                     <td colSpan={columns.length} className="px-0 py-8">
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
}
