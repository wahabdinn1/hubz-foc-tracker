import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import React, { memo, type Dispatch, type SetStateAction } from "react";

interface MasterListPaginationProps {
    currentPage: number;
    setCurrentPage: Dispatch<SetStateAction<number>> | ((page: number) => void);
    totalPages: number;
    rowsPerPage: number;
    setRowsPerPage: Dispatch<SetStateAction<number>> | ((size: number) => void);
}

export const MasterListPagination = memo(function MasterListPagination({ currentPage, setCurrentPage, totalPages, rowsPerPage, setRowsPerPage }: MasterListPaginationProps) {
    const setPage = (val: number | ((prev: number) => number)) => {
        if (typeof val === "function") {
            setCurrentPage(val(currentPage));
        } else {
            setCurrentPage(val);
        }
    };

    const setPageSize = (val: number | ((prev: number) => number)) => {
        if (typeof val === "function") {
            setRowsPerPage(val(rowsPerPage));
        } else {
            setRowsPerPage(val);
        }
    };

    return (
        <div className="px-6 py-4 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-white/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-4">
                <Select
                    value={String(rowsPerPage)}
                    onValueChange={(val) => {
                        setPageSize(Number(val));
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[110px] h-9 bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.08] rounded-xl text-zinc-600 dark:text-zinc-300 text-xs font-bold">
                        <SelectValue placeholder="10 rows" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-black/[0.08] dark:border-white/[0.08] rounded-xl text-zinc-700 dark:text-zinc-200">
                        <SelectItem value="10">10 rows</SelectItem>
                        <SelectItem value="25">25 rows</SelectItem>
                        <SelectItem value="50">50 rows</SelectItem>
                        <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block font-medium">
                    Page <span className="text-zinc-900 dark:text-white font-bold tabular-nums">{currentPage}</span> of <span className="font-bold text-zinc-900 dark:text-white tabular-nums">{totalPages}</span>
                </p>
            </div>
            <div className="flex items-center gap-2">
                {/* Page Jump Input */}
                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Go to</span>
                    <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        className="w-14 h-8 text-center text-xs bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.08] rounded-xl text-zinc-700 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-bold"
                        placeholder={String(currentPage)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                const val = parseInt((e.target as HTMLInputElement).value);
                                if (val >= 1 && val <= totalPages) {
                                    setPage(val);
                                    (e.target as HTMLInputElement).value = "";
                                }
                            }
                        }}
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.08] rounded-xl hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-blue-500 text-zinc-400 dark:text-zinc-500 transition-colors"
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.08] dark:border-white/[0.08] rounded-xl hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-blue-500 text-zinc-400 dark:text-zinc-500 transition-colors"
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
});
