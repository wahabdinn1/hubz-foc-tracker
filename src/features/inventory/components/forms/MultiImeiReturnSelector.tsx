"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { InventoryItem } from "@/types/inventory";

interface MultiImeiReturnSelectorProps {
    loanedItems: InventoryItem[];
    selectedItems: InventoryItem[];
    onSelectionChange: (items: InventoryItem[]) => void;
}

export function MultiImeiReturnSelector({ loanedItems, selectedItems, onSelectionChange }: MultiImeiReturnSelectorProps) {
    const [open, setOpen] = useState(false);

    const selectedImeis = new Set(selectedItems.map(i => i.imei));

    function toggleItem(item: InventoryItem) {
        if (selectedImeis.has(item.imei)) {
            onSelectionChange(selectedItems.filter(i => i.imei !== item.imei));
        } else {
            onSelectionChange([...selectedItems, item]);
        }
    }

    function removeItem(imei: string) {
        onSelectionChange(selectedItems.filter(i => i.imei !== imei));
    }

    return (
        <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors">
                    Select Units to Return
                </label>
                {selectedItems.length > 0 && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {selectedItems.length} unit{selectedItems.length !== 1 ? "s" : ""} selected
                    </span>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        type="button"
                        className={cn(
                            "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal whitespace-pre-wrap h-auto min-h-[40px] text-left",
                            selectedItems.length === 0 && "text-neutral-500 dark:text-neutral-400"
                        )}
                    >
                        {selectedItems.length > 0
                            ? `${selectedItems.length} unit${selectedItems.length !== 1 ? "s" : ""} selected — click to add/remove`
                            : "Search and select units to return..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search IMEI, Unit Name, or KOL..." />
                        <CommandList>
                            <CommandEmpty>No loaned items found.</CommandEmpty>
                            <CommandGroup>
                                {loanedItems.map((item) => {
                                    const isSelected = selectedImeis.has(item.imei);
                                    return (
                                        <CommandItem
                                            value={`${item.imei} ${item.unitName} ${item.onHolder}`}
                                            key={item.imei}
                                            onSelect={() => toggleItem(item)}
                                            className={cn(isSelected && "bg-blue-50 dark:bg-blue-950/30")}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 shrink-0",
                                                    isSelected ? "opacity-100 text-blue-600 dark:text-blue-400" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                <span className="font-medium text-sm truncate">{item.unitName}</span>
                                                <span className="text-xs text-neutral-400 font-mono truncate">{item.imei}</span>
                                                <span className="text-xs text-amber-500 dark:text-amber-400 truncate">
                                                    Held by: {item.onHolder || "Unknown KOL"}
                                                </span>
                                            </div>
                                            {item.focStatus ? (
                                                <span className={cn(
                                                    "ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase font-medium flex-shrink-0",
                                                    item.focStatus.toUpperCase().includes("UNRETURN")
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : item.focStatus.toUpperCase().includes("RETURN")
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                )}>
                                                    {item.focStatus}
                                                </span>
                                            ) : null}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {selectedItems.length > 0 && (
                <div className="space-y-2">
                    {selectedItems.map((item) => (
                        <div
                            key={item.imei}
                            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 transition-colors group"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">{item.unitName}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">{item.imei}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 truncate">From: {item.onHolder || "Unknown KOL"}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(item.imei)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                                aria-label={`Remove ${item.unitName}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
