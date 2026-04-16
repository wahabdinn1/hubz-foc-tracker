import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Dispatch, SetStateAction } from "react";

interface MasterListFiltersProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    statusFilter: string;
    setStatusFilter: Dispatch<SetStateAction<string>>;
    locationFilter: string;
    setLocationFilter: Dispatch<SetStateAction<string>>;
    filteredCount: number;
}

export function MasterListFilters({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    filteredCount,
}: MasterListFiltersProps) {
    return (
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <Input
                        placeholder="Search by IMEI, Unit, or KOL..."
                        className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 focus-visible:ring-blue-500 pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3 h-3 text-neutral-500" />
                                <span className="truncate"><SelectValue placeholder="Status" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="RETURN">Return</SelectItem>
                            <SelectItem value="UNRETURN">Unreturn</SelectItem>
                            <SelectItem value="MISSING">Missing</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                            <div className="flex items-center gap-2">
                                <Filter className="w-3 h-3 text-neutral-500" />
                                <span className="truncate"><SelectValue placeholder="Location" /></span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200">
                            <SelectItem value="ALL">All Location</SelectItem>
                            <SelectItem value="AVAILABLE">Available</SelectItem>
                            <SelectItem value="LOANED">Loaned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="text-sm text-neutral-500 whitespace-nowrap hidden lg:block">
                Showing {filteredCount} results
            </div>
        </div>
    );
}
