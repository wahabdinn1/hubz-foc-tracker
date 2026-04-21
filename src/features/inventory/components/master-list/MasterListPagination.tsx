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
        <div className="p-3 sm:p-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
                <Select
                    value={String(rowsPerPage)}
                    onValueChange={(val) => {
                        setPageSize(Number(val));
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[110px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                        <SelectValue placeholder="10 rows" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                        <SelectItem value="10">10 rows</SelectItem>
                        <SelectItem value="25">25 rows</SelectItem>
                        <SelectItem value="50">50 rows</SelectItem>
                        <SelectItem value="100">100 rows</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 hidden sm:block">
                    Page <span className="text-neutral-900 dark:text-white font-medium">{currentPage}</span> of <span className="font-medium text-neutral-900 dark:text-white">{totalPages}</span>
                </p>
            </div>
            <div className="flex items-center gap-2">
                {/* Page Jump Input */}
                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-neutral-500">Go to</span>
                    <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        className="w-16 h-8 text-center text-sm bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    className="w-8 h-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white focus-visible:ring-blue-500 text-neutral-500 dark:text-neutral-300"
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white focus-visible:ring-blue-500 text-neutral-500 dark:text-neutral-300"
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
});
