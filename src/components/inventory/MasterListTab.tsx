"use client";

import { useState, useMemo, useEffect } from "react";
import type { InventoryItem } from "@/types/inventory";
import { MasterListFilters } from "./master-list/MasterListFilters";
import { MasterListMobileCards } from "./master-list/MasterListMobileCards";
import { MasterListTable } from "./master-list/MasterListTable";
import { MasterListPagination } from "./master-list/MasterListPagination";

interface MasterListTabProps {
    inventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
    initialFilter?: string;
}

export function MasterListTab({ inventory, setSelectedItem, initialFilter }: MasterListTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(() => {
        if (initialFilter === "unreturn") return "UNRETURN";
        return "ALL";
    });
    const [locationFilter, setLocationFilter] = useState(() => {
        if (initialFilter === "available") return "AVAILABLE";
        if (initialFilter === "loaned") return "LOANED";
        return "ALL";
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem, direction: 'asc' | 'desc' } | null>(null);

    const filteredInventory = useMemo(() =>
        inventory.filter(item => {
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
        })
    , [inventory, searchQuery, statusFilter, locationFilter]);

    const sortedInventory = useMemo(() =>
        [...filteredInventory].sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;
            const aVal = String(a[key] || '').toLowerCase();
            const bVal = String(b[key] || '').toLowerCase();
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        })
    , [filteredInventory, sortConfig]);

    const handleSort = (key: keyof InventoryItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const totalPages = Math.ceil(sortedInventory.length / rowsPerPage) || 1;
    const paginatedInventory = sortedInventory.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Fix: Move page reset to useEffect instead of during render (#8)
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
    }, [currentPage, totalPages]);

    return (
        <div className="border border-black/5 dark:border-white/[0.08] rounded-xl md:rounded-2xl bg-white/80 dark:bg-neutral-900/40 overflow-hidden backdrop-blur-xl shadow-2xl flex flex-col">
            <MasterListFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                locationFilter={locationFilter}
                setLocationFilter={setLocationFilter}
                filteredCount={filteredInventory.length}
            />

            <div className="overflow-x-auto flex-1 relative max-h-[calc(100vh-280px)] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                <MasterListMobileCards
                    paginatedInventory={paginatedInventory}
                    setSelectedItem={setSelectedItem}
                />
                <MasterListTable
                    paginatedInventory={paginatedInventory}
                    setSelectedItem={setSelectedItem}
                    sortConfig={sortConfig}
                    handleSort={handleSort}
                />
            </div>

            <MasterListPagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
            />
        </div>
    );
}
