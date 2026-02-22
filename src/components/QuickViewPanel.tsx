import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "../../server/actions";
import { cn } from "@/lib/utils";

interface QuickViewPanelProps {
    item: InventoryItem | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function QuickViewPanel({ item, isOpen, onOpenChange }: QuickViewPanelProps) {
    if (!item) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-lg bg-white/95 dark:bg-neutral-950/95 transition-colors border-l border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 custom-scrollbar shadow-2xl">
                <SheetHeader className="mb-8 space-y-3">
                    <div className="flex items-start justify-between pr-6">
                        <div className="space-y-1 text-left">
                            <SheetTitle className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors tracking-tight">{item.unitName || "Unnamed Unit"}</SheetTitle>
                            <SheetDescription className="text-neutral-500 dark:text-neutral-400 font-mono text-sm">
                                IMEI: {item.imei || "N/A"}
                            </SheetDescription>
                        </div>
                        <Badge variant="outline" className={cn(
                            "px-3 py-1 text-xs select-none",
                            item.statusLocation?.includes("AVAILABLE") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                item.statusLocation?.toUpperCase().includes("LOANED") ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                                    "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-500/20"
                        )}>
                            {item.statusLocation || "UNKNOWN"}
                        </Badge>
                    </div>
                </SheetHeader>

                {/* Structured details mapping */}
                <div className="space-y-4 pb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 transition-colors flex-1" />
                        <span className="text-xs font-medium text-neutral-500 uppercase tracking-widest px-2">Complete Data Record</span>
                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 transition-colors flex-1" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {Object.entries(item.fullData || {}).map(([key, value]) => {
                            const displayValue = value && value.trim() !== "" ? value : "-";
                            const isDate = key.toLowerCase().includes('date') || key.toLowerCase().includes('timestamp');
                            const isLink = value.startsWith('http');

                            return (
                                <div key={key} className="flex flex-col space-y-1.5 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 transition-colors border border-black/5 dark:border-neutral-800/50 hover:bg-black/5 dark:hover:bg-neutral-800/50">
                                    <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">{key}</span>
                                    {isLink ? (
                                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline break-all">
                                            {displayValue}
                                        </a>
                                    ) : (
                                        <span className={cn(
                                            "text-sm font-medium whitespace-pre-wrap",
                                            displayValue === "-" ? "text-neutral-400 dark:text-neutral-600 transition-colors" : "text-neutral-900 dark:text-neutral-200 transition-colors",
                                            isDate ? "font-mono" : ""
                                        )}>
                                            {displayValue}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
