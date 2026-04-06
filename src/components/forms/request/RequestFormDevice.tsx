"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Check, ChevronsUpDown, Layers, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DEVICE_CATEGORIES } from "@/lib/constants";
import type { InventoryItem } from "@/types/inventory";
import { Button } from "@/components/ui/button";

interface RequestFormDeviceProps {
    categories: { name: string; count: number }[];
    filteredItems: InventoryItem[];
    selectedCategory: string;
    handleCategoryChange: (val: string) => void;
    imeiPopoverOpen: boolean;
    setImeiPopoverOpen: (val: boolean) => void;
    setAutoFilledFoc: (val: string | null) => void;
    extractFocType: (item: InventoryItem) => string;
}

function getCategoryIcon(name: string): string {
    const cat = DEVICE_CATEGORIES.find(c => c.label === name);
    return cat?.icon || "📦";
}

export function RequestFormDevice({
    categories,
    filteredItems,
    selectedCategory,
    handleCategoryChange,
    imeiPopoverOpen,
    setImeiPopoverOpen,
    setAutoFilledFoc,
    extractFocType
}: RequestFormDeviceProps) {
    const form = useFormContext();
    const watchImei = useWatch({ name: "imeiIfAny" });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Device Category Dropdown */}
            <FormItem className="flex flex-col">
                <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                    <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Select Device Category
                    </span>
                </FormLabel>
                <Select
                    value={selectedCategory || undefined}
                    onValueChange={handleCategoryChange}
                >
                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                        <SelectValue placeholder="Choose category first..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                        {categories.map((cat) => (
                            <SelectItem
                                key={cat.name}
                                value={cat.name}
                                className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span>{getCategoryIcon(cat.name)}</span>
                                    <span>{cat.name}</span>
                                    <span className="ml-auto text-xs text-neutral-400 tabular-nums">({cat.count})</span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {!selectedCategory && (
                    <p className="text-xs text-neutral-400 mt-1">Select a category to see available units</p>
                )}
            </FormItem>

            {/* Step 2: IMEI/Unit Selection (only active after category) */}
            <FormField
                control={form.control}
                name="imeiIfAny"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            <span className="flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5" />
                                Select Unit / IMEI
                            </span>
                        </FormLabel>
                        <Popover open={imeiPopoverOpen} onOpenChange={setImeiPopoverOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={!selectedCategory}
                                        className={cn(
                                            "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal whitespace-pre-wrap h-auto min-h-[40px] text-left",
                                            !field.value && "text-neutral-500 dark:text-neutral-400",
                                            !selectedCategory && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {!selectedCategory
                                            ? "Select a category first"
                                            : field.value === "none"
                                                ? "None (Define manually)"
                                                : !field.value
                                                    ? `Select from ${filteredItems.length} available unit${filteredItems.length !== 1 ? "s" : ""}...`
                                                    : (() => {
                                                        const item = filteredItems.find(i => i.imei === field.value);
                                                        return item ? `${item.imei} — ${item.unitName}` : field.value;
                                                    })()
                                        }
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search IMEI or Unit Name..." />
                                    <CommandList>
                                        <CommandEmpty>No available units in this category.</CommandEmpty>
                                        <CommandGroup heading={`${selectedCategory} — ${filteredItems.length} available`}>
                                            <CommandItem
                                                value="none define manually"
                                                onSelect={() => {
                                                    field.onChange("none");
                                                    form.setValue("unitName", "");
                                                    form.setValue("typeOfFoc", "");
                                                    setAutoFilledFoc(null);
                                                    setImeiPopoverOpen(false);
                                                }}
                                                className="italic text-neutral-500"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        field.value === "none" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                None (Define manually)
                                            </CommandItem>
                                            {filteredItems.map((item) => (
                                                <CommandItem
                                                    value={`${item.imei} ${item.unitName}`}
                                                    key={item.imei}
                                                    onSelect={() => {
                                                        field.onChange(item.imei);
                                                        form.setValue("unitName", item.unitName || "");
                                                        // Auto-fill Type of FOC from spreadsheet Column D
                                                        const focType = extractFocType(item);
                                                        if (focType) {
                                                            form.setValue("typeOfFoc", focType, { shouldValidate: true });
                                                            setAutoFilledFoc(focType);
                                                        }
                                                        setImeiPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            item.imei === field.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="font-medium text-sm truncate">{item.unitName}</span>
                                                        <span className="text-xs text-neutral-400 font-mono truncate">{item.imei}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            {/* Unit Name (Auto-filled from IMEI selection, or manual entry) */}
            <FormField
                control={form.control}
                name="unitName"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Unit Name</FormLabel>
                        <FormControl>
                            <Input
                                placeholder="e.g. S24 Ultra Titanium"
                                className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500 disabled:opacity-50"
                                disabled={!!watchImei && watchImei !== "none" && watchImei !== ""}
                                {...field}
                            />
                        </FormControl>
                        {watchImei && watchImei !== "none" && watchImei !== "" && (
                            <p className="text-xs text-blue-500 mt-1">Auto-filled from selected unit</p>
                        )}
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
        </div>
    );
}
