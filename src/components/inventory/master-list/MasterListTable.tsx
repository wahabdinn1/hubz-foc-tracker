import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { isItemOverdue } from "@/lib/date-utils";
import { isStatusAvailable, isStatusLoaned } from "@/lib/constants";
import type { InventoryItem } from "@/types/inventory";

interface MasterListTableProps {
    paginatedInventory: InventoryItem[];
    setSelectedItem: (item: InventoryItem) => void;
    sortConfig: { key: keyof InventoryItem, direction: 'asc' | 'desc' } | null;
    handleSort: (key: keyof InventoryItem) => void;
}

export function MasterListTable({ 
    paginatedInventory, 
    setSelectedItem, 
    sortConfig, 
    handleSort
}: MasterListTableProps) {
    return (
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
                    <th onClick={() => handleSort('focStatus')} className="px-5 py-4 font-semibold tracking-wider cursor-pointer hover:text-neutral-900 dark:hover:text-white group whitespace-nowrap">
                        <div className="flex items-center gap-1">FOC Status {sortConfig?.key === 'focStatus' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
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
                            const overdue = isItemOverdue(item);
                            return (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15, delay: Math.min(idx * 0.05, 0.3) }}
                                    key={`${item.imei}-${item.unitName}-${idx}`}
                                    onClick={() => setSelectedItem(item)}
                                    className={cn(
                                        "transition-colors group cursor-pointer",
                                        overdue ? "bg-red-950/20 hover:bg-red-900/30 border-l-[3px] border-l-orange-500" : "hover:bg-neutral-50 dark:hover:bg-white/5 border-l-[3px] border-l-transparent"
                                    )}
                                >
                                    <td className="px-5 py-4 font-medium text-neutral-900 dark:text-neutral-200 group-hover:text-blue-400 whitespace-nowrap">{item.unitName || "-"}</td>
                                    <td className="px-5 py-4 text-neutral-500 dark:text-neutral-400 font-mono text-xs whitespace-nowrap">{item.imei || "-"}</td>
                                    <td className="px-5 py-4 text-neutral-700 dark:text-neutral-300 min-w-[150px]">{item.onHolder || "-"}</td>
                                    <td className="px-5 py-4 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{item.goatPic || item.step1Data?.seinPicName || "-"}</td>
                                    <td className="px-5 py-4 text-xs font-mono whitespace-nowrap">
                                        {(() => {
                                            const rd = item.step3Data?.timestamp;
                                            return rd && rd.trim() !== "" && rd !== "-"
                                                ? <span className="text-neutral-600 dark:text-neutral-400">{rd}</span>
                                                : <span className="text-neutral-300 dark:text-neutral-600 italic">—</span>;
                                        })()}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        {(() => {
                                            const status = item.focStatus?.toUpperCase().trim();
                                            if (!status || status === "-") return <span className="text-neutral-300 dark:text-neutral-600 italic">—</span>;
                                            return (
                                                <Badge variant="outline" className={cn(
                                                    "text-[11px] font-semibold",
                                                    status === "RETURN" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                                        status === "UNRETURN" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                            "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                                                )}>
                                                    {item.focStatus}
                                                </Badge>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <Badge variant="outline" className={cn(
                                            isStatusAvailable(item.statusLocation) ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                isStatusLoaned(item.statusLocation) ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                                    "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20",
                                            overdue && "border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                                        )}>
                                            {item.statusLocation || "UNKNOWN"}
                                        </Badge>
                                    </td>
                                </motion.tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan={8} className="px-0 py-8">
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
    );
}
