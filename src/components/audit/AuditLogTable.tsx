"use client";

import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { Search, ArrowUpDown, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { RequestHistoryItem, ReturnHistoryItem } from "@/types/inventory";

export interface AuditEvent {
    id: string; // generated for react key
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
    // Request specific
    campaignName?: string;
    deliveryDate?: string;
    typeOfDelivery?: string;
    dateObj: Date;
}

interface AuditLogTableProps {
    requests: RequestHistoryItem[];
    returns: ReturnHistoryItem[];
}

function parseDateSafely(dateStr: string): Date {
    if (!dateStr) return new Date(0);
    
    // Check DD/MM/YYYY HH:mm:ss format
    const ddMmYyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?: (\d{1,2}):(\d{2}):(\d{2}))?/);
    if (ddMmYyyyMatch) {
       const [_, d, m, y, h, min, s] = ddMmYyyyMatch;
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

import { MasterListPagination } from "@/components/inventory/master-list/MasterListPagination";

export function AuditLogTable({ requests, returns }: AuditLogTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"ALL" | "REQUEST" | "RETURN">("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Unify and sort events
    const allEvents: AuditEvent[] = [
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
    ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()); // newest first

    const filteredEvents = allEvents.filter(event => {
        const matchesType = typeFilter === "ALL" || event.type === typeFilter;
        if (!matchesType) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                event.imei.toLowerCase().includes(query) ||
                event.unitName.toLowerCase().includes(query) ||
                event.kolName.toLowerCase().includes(query) ||
                event.requestor.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const totalPages = Math.ceil(filteredEvents.length / rowsPerPage) || 1;
    const paginatedEvents = filteredEvents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
                                    setCurrentPage(1);
                                }}
                                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={(val: any) => { setTypeFilter(val); setCurrentPage(1); }}>
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
                        Showing {filteredEvents.length} events
                    </div>
                </div>

                <div className="overflow-x-auto flex-1 relative max-h-[calc(100vh-280px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20 shadow-sm">
                            <TableRow>
                                <TableHead>Date / Time</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Unit & IMEI</TableHead>
                                <TableHead>KOL / Holder</TableHead>
                                <TableHead>Requestor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedEvents.length > 0 ? (
                                paginatedEvents.map((event) => (
                                    <TableRow key={event.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <TableCell className="whitespace-nowrap">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {event.dateObj.getTime() > 0 ? format(event.dateObj, "MMM dd, yyyy") : event.timestamp}
                                            </div>
                                            <div className="text-xs text-neutral-500">
                                                {event.dateObj.getTime() > 0 ? format(event.dateObj, "HH:mm") : ""}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={event.type === "REQUEST" ? "outline" : "secondary"} className={
                                                event.type === "REQUEST" 
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50" 
                                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                                            }>
                                                {event.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">{event.unitName}</div>
                                            <div className="text-xs font-mono text-neutral-500">{event.imei}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-neutral-900 dark:text-neutral-100">{event.kolName || "-"}</div>
                                            {(event.campaignName || event.typeOfFoc) && (
                                                <div className="text-xs text-neutral-500 truncate max-w-[200px]">
                                                    {event.typeOfFoc} {event.campaignName ? `• ${event.campaignName}` : ""}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-neutral-900 dark:text-neutral-100">{event.requestor}</div>
                                            <div className="text-xs text-neutral-500 truncate max-w-[150px]" title={event.email}>{event.email}</div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-neutral-500">
                                        No events found matching your filter.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <MasterListPagination
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    totalPages={totalPages}
                    rowsPerPage={rowsPerPage}
                    setRowsPerPage={setRowsPerPage}
                />
            </div>
        </div>
    );
}
