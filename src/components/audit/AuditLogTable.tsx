"use client";

import { useState, useMemo } from "react";
import { format, isValid } from "date-fns";
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
import { Search, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MasterListPagination } from "@/components/inventory/master-list/MasterListPagination";
import type { RequestHistoryItem, ReturnHistoryItem } from "@/types/inventory";

export interface AuditEvent {
    id: string;
    type: "REQUEST" | "RETURN";
    timestamp: string;
    email: string;
    requestor: string;
    unitName: string;
    imei: string;
    kolName: string;
    kolPhone: string;
    kolAddress: string;
    typeOfFoc: string;
    campaignName?: string;
    deliveryDate?: string;
    typeOfDelivery?: string;
    dateObj: Date;
}

interface AuditLogTableProps {
    requests: RequestHistoryItem[];
    returns: ReturnHistoryItem[];
}

function parseDateSafely(dateStr: string | undefined): Date {
    if (!dateStr || dateStr === "-") return new Date(0);

    const yyyyMmDdMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (yyyyMmDdMatch) {
        const [, y, m, d] = yyyyMmDdMatch;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }

    const mdYyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2}):(\d{2}))?/);
    if (mdYyyyMatch) {
        const [, m, d, y, h, min, s] = mdYyyyMatch;
        return new Date(
            parseInt(y),
            parseInt(m) - 1,
            parseInt(d),
            h ? parseInt(h) : 0,
            min ? parseInt(min) : 0,
            s ? parseInt(s) : 0
        );
    }

    const d = new Date(dateStr);
    return isValid(d) ? d : new Date(0);
}

export function AuditLogTable({ requests, returns }: AuditLogTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "REQUEST" | "RETURN">("ALL");
    const [sorting, setSorting] = useState<SortingState>([{ id: "dateObj", desc: true }]);

    const allEvents: AuditEvent[] = useMemo(() => [
        ...requests.map((r, i) => ({
            id: `req-${i}`,
            type: "REQUEST" as const,
            timestamp: r.timestamp,
            email: r.email,
            requestor: r.requestor,
            unitName: r.unitName,
            imei: r.imei,
            kolName: r.kolName,
            kolPhone: r.kolPhone,
            kolAddress: r.kolAddress,
            typeOfFoc: r.typeOfFoc,
            campaignName: r.campaignName,
            deliveryDate: r.deliveryDate,
            typeOfDelivery: r.typeOfDelivery,
            dateObj: parseDateSafely(r.timestamp)
        })),
        ...returns.map((r, i) => ({
            id: `ret-${i}`,
            type: "RETURN" as const,
            timestamp: r.timestamp,
            email: r.email,
            requestor: r.requestor,
            unitName: r.unitName,
            imei: r.imei,
            kolName: r.fromKol,
            kolPhone: r.kolPhone,
            kolAddress: r.kolAddress,
            typeOfFoc: r.typeOfFoc,
            dateObj: parseDateSafely(r.timestamp)
        }))
    ], [requests, returns]);

    const filteredData = useMemo(() => {
        let data = allEvents;
        if (typeFilter !== "ALL") {
            data = data.filter(e => e.type === typeFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            data = data.filter(e =>
                e.imei.toLowerCase().includes(query) ||
                e.unitName.toLowerCase().includes(query) ||
                (e.kolName && e.kolName.toLowerCase().includes(query)) ||
                (e.requestor && e.requestor.toLowerCase().includes(query))
            );
        }
        return data;
    }, [allEvents, typeFilter, searchQuery]);

    const columns = useMemo<ColumnDef<AuditEvent, unknown>[]>(() => [
        {
            accessorKey: "dateObj",
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 focus:outline-none transition-colors font-medium">
                    Date / Time
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${column.getIsSorted() ? "opacity-100 text-blue-500" : "opacity-30"}`} />
                </button>
            ),
            cell: ({ row }) => (
                <div className="whitespace-nowrap">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {row.original.dateObj.getTime() > 0 ? format(row.original.dateObj, "MM/dd/yyyy") : row.original.timestamp.split(" ")[0]}
                    </div>
                </div>
            ),
            sortingFn: (a, b) => a.original.dateObj.getTime() - b.original.dateObj.getTime(),
        },
        {
            accessorKey: "type",
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 focus:outline-none transition-colors font-medium">
                    FOC Status
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${column.getIsSorted() ? "opacity-100 text-blue-500" : "opacity-30"}`} />
                </button>
            ),
            cell: ({ row }) => (
                <Badge variant={row.original.type === "REQUEST" ? "outline" : "secondary"} className={
                    row.original.type === "REQUEST"
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                }>
                    {row.original.type}
                </Badge>
            ),
        },
        {
            id: "unit",
            accessorFn: (row) => row.unitName,
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 focus:outline-none transition-colors font-medium">
                    Unit & IMEI
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${column.getIsSorted() ? "opacity-100 text-blue-500" : "opacity-30"}`} />
                </button>
            ),
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.unitName}</div>
                    <div className="text-xs font-mono text-neutral-500">{row.original.imei}</div>
                </div>
            ),
            sortingFn: (a, b) => a.original.unitName.localeCompare(b.original.unitName) || a.original.imei.localeCompare(b.original.imei),
        },
        {
            accessorKey: "kolName",
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 focus:outline-none transition-colors font-medium">
                    KOL / Holder
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${column.getIsSorted() ? "opacity-100 text-blue-500" : "opacity-30"}`} />
                </button>
            ),
            cell: ({ row }) => (
                <div>
                    <div className="text-neutral-900 dark:text-neutral-100">{row.original.kolName || "-"}</div>
                    {(row.original.campaignName || row.original.typeOfFoc) ? (
                        <div className="text-xs text-neutral-500 truncate max-w-[200px]">
                            {row.original.typeOfFoc} {row.original.campaignName ? `• ${row.original.campaignName}` : ""}
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            accessorKey: "requestor",
            header: ({ column }) => (
                <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100 focus:outline-none transition-colors font-medium">
                    Requestor
                    <ArrowUpDown className={`w-3 h-3 transition-opacity ${column.getIsSorted() ? "opacity-100 text-blue-500" : "opacity-30"}`} />
                </button>
            ),
            cell: ({ row }) => (
                <div>
                    <div className="text-neutral-900 dark:text-neutral-100">{row.original.requestor}</div>
                    <div className="text-xs text-neutral-500 truncate max-w-[150px]" title={row.original.email}>{row.original.email}</div>
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: 15 },
        },
    });

    return (
        <div className="w-full flex-1">
            <div className="border border-black/5 dark:border-white/[0.08] rounded-xl md:rounded-2xl bg-white/80 dark:bg-neutral-900/40 overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <Input
                                placeholder="Search IMEI, KOL, Requestor..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    table.setPageIndex(0);
                                }}
                                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={(val: string) => { setTypeFilter(val as "ALL" | "REQUEST" | "RETURN"); table.setPageIndex(0); }}>
                            <SelectTrigger className="w-full sm:w-[150px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3 h-3 text-neutral-500" />
                                    <span className="truncate"><SelectValue placeholder="Event Type" /></span>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                                <SelectItem value="ALL">All Events</SelectItem>
                                <SelectItem value="REQUEST">Requests</SelectItem>
                                <SelectItem value="RETURN">Returns</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-neutral-500 whitespace-nowrap hidden lg:block">
                        Showing {filteredData.length} events
                    </div>
                </div>

                <div className="overflow-x-auto flex-1 relative max-h-[calc(100vh-280px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20 shadow-sm">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-4 py-3">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.original.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-4 py-3">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-32 text-center text-neutral-500">
                                        No events found matching your filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <MasterListPagination
                    currentPage={table.getState().pagination.pageIndex + 1}
                    setCurrentPage={(page: number) => table.setPageIndex(page - 1)}
                    totalPages={table.getPageCount()}
                    rowsPerPage={table.getState().pagination.pageSize}
                    setRowsPerPage={(size: number) => table.setPageSize(size)}
                />
            </div>
        </div>
    );
}
