import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import React, { memo, type Dispatch, type SetStateAction } from "react";

interface MasterListFiltersProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    statusFilter: string;
    setStatusFilter: Dispatch<SetStateAction<string>>;
    locationFilter: string;
    setLocationFilter: Dispatch<SetStateAction<string>>;
    filteredCount: number;
}

export const MasterListFilters = memo(function MasterListFilters({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    filteredCount,
}: MasterListFiltersProps) {
    return (
        <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-xs md:text-sm text-neutral-500 whitespace-nowrap hidden lg:block ml-2">
                Showing {filteredCount} results
            </div>
            
            <div className="flex items-center gap-3 flex-1 lg:flex-none justify-end">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                        placeholder="Filter data matrix..."
                        className="h-10 sm:h-11 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-black/5 dark:border-white/10 rounded-full pl-11 pr-4 focus-visible:ring-blue-500 shadow-sm text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[130px] shrink-0 h-10 sm:h-11 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-black/5 dark:border-white/10 rounded-full text-sm shadow-sm hidden md:flex">
                            <div className="flex items-center gap-2">
                                <span className="truncate"><SelectValue placeholder="Status" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-xl">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="RETURN">Return</SelectItem>
                            <SelectItem value="UNRETURN">Unreturn</SelectItem>
                            <SelectItem value="MISSING">Missing</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-[110px] sm:w-[130px] shrink-0 h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 text-white border-transparent rounded-full shadow-lg shadow-blue-500/20 text-sm font-semibold transition-all">
                            <div className="flex items-center gap-2 w-full justify-center">
                                <Filter className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate"><SelectValue placeholder="Filters" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-xl">
                            <SelectItem value="ALL">All Location</SelectItem>
                            <SelectItem value="AVAILABLE">Available</SelectItem>
                            <SelectItem value="LOANED">Loaned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
});
