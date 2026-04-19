"use client";

import { useState, useMemo, useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { format } from "date-fns";
import {
    Check,
    ChevronsUpDown,
    Layers,
    Smartphone,
    CalendarIcon,
    Trash2,
    Phone,
    MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";

import { getCategoryIcon, extractFocType } from "@/lib/device-utils";
import type { InventoryItem } from "@/types/inventory";
import { useDeviceCategories } from "@/hooks/useDeviceCategories";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";

interface RequestFormDeviceRowProps {
    index: number;
    availableItems: InventoryItem[];
    selectedImeis: Set<string>;
    onRemove: () => void;
    canRemove: boolean;
}

export function RequestFormDeviceRow({
    index,
    availableItems,
    selectedImeis,
    onRemove,
    canRemove,
}: RequestFormDeviceRowProps) {
    const form = useFormContext();
    const prefix = `devices.${index}`;

    const [selectedCategory, setSelectedCategory] = useState("");
    const [imeiPopoverOpen, setImeiPopoverOpen] = useState(false);

    const [datePopoverOpen, setDatePopoverOpen] = useState(false);

    const watchImei = useWatch({ name: `${prefix}.imeiIfAny` });

    const filterAvailable = useCallback(
        (item: InventoryItem) =>
            item.statusLocation?.toUpperCase().includes("AVAILABLE") ?? false,
        []
    );

    const { categories, getFilteredItems } = useDeviceCategories(
        availableItems,
        filterAvailable
    );

    const filteredItems = useMemo(() => {
        const items = getFilteredItems(selectedCategory);
        return items.filter((item) => !selectedImeis.has(item.imei));
    }, [selectedCategory, getFilteredItems, selectedImeis]);

    function handleCategoryChange(value: string) {
        setSelectedCategory(value);
        form.setValue(`${prefix}.imeiIfAny`, "");
        form.setValue(`${prefix}.unitName`, "");
        form.setValue(`${prefix}.typeOfFoc`, "");

    }
    
    const { options: deliveryOptions, isLoading: loadingDelivery } = useDropdownOptions("DELIVERY_TYPE");
    const displayDeliveryTypes = deliveryOptions.map(o => o.value);

    return (
        <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-950/30">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Device #{index + 1}
                </h4>
                {canRemove && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRemove}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-7 px-2"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Select */}
                <FormItem className="flex flex-col">
                    <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                        <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Device Category
                        </span>
                    </FormLabel>
                    <Select
                        value={selectedCategory || undefined}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                            <SelectValue placeholder="Choose category..." />
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
                                        <span className="ml-auto text-xs text-neutral-400 tabular-nums">
                                            ({cat.count})
                                        </span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!selectedCategory && (
                        <p className="text-xs text-neutral-400 mt-1">
                            Select a category to see available units
                        </p>
                    )}
                </FormItem>

                {/* IMEI/Unit Selection */}
                <FormField
                    control={form.control}
                    name={`${prefix}.imeiIfAny`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <Smartphone className="w-3.5 h-3.5" />
                                    Select Unit / IMEI
                                </span>
                            </FormLabel>
                            <Popover
                                open={imeiPopoverOpen}
                                onOpenChange={setImeiPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!selectedCategory}
                                            className={cn(
                                                "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal whitespace-pre-wrap h-auto min-h-[40px] text-left",
                                                !field.value &&
                                                    "text-neutral-500 dark:text-neutral-400",
                                                !selectedCategory &&
                                                    "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {!selectedCategory
                                                ? "Select a category first"
                                                : field.value === "none"
                                                  ? "None (Define manually)"
                                                  : !field.value
                                                    ? `Select from ${filteredItems.length} available unit${filteredItems.length !== 1 ? "s" : ""}...`
                                                    : (() => {
                                                          const item =
                                                              filteredItems.find(
                                                                  (i) =>
                                                                      i.imei ===
                                                                      field.value
                                                              );
                                                          return item
                                                              ? item.imei
                                                              : field.value;
                                                      })()}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Search IMEI or Unit Name..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                No available units in this
                                                category.
                                            </CommandEmpty>
                                            <CommandGroup
                                                heading={`${selectedCategory} — ${filteredItems.length} available`}
                                            >
                                                <CommandItem
                                                    value="none define manually"
                                                    onSelect={() => {
                                                        field.onChange("none");
                                                        form.setValue(
                                                            `${prefix}.unitName`,
                                                            ""
                                                        );
                                                        form.setValue(
                                                            `${prefix}.typeOfFoc`,
                                                            ""
                                                        );

                                                        setImeiPopoverOpen(false);
                                                    }}
                                                    className="italic text-neutral-500"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            field.value ===
                                                                "none"
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    None (Define manually)
                                                </CommandItem>
                                                {filteredItems.map((item) => (
                                                    <CommandItem
                                                        value={`${item.imei} ${item.unitName}`}
                                                        key={item.imei}
                                                        onSelect={() => {
                                                            field.onChange(
                                                                item.imei
                                                            );
                                                            form.setValue(
                                                                `${prefix}.unitName`,
                                                                item.unitName ||
                                                                    ""
                                                            );
                                                            const focType =
                                                                extractFocType(
                                                                    item
                                                                );
                                                            if (focType) {
                                                                form.setValue(
                                                                    `${prefix}.typeOfFoc`,
                                                                    focType,
                                                                    {
                                                                        shouldValidate:
                                                                            true,
                                                                    }
                                                                );
                                                            }
                                                            setImeiPopoverOpen(
                                                                false
                                                            );
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                item.imei ===
                                                                    field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                            <span className="font-medium text-sm truncate">
                                                                {item.unitName}
                                                            </span>
                                                            <span className="text-xs text-neutral-400 font-mono truncate">
                                                                {item.imei}
                                                            </span>
                                                        </div>
                                                        {item.focStatus && (
                                                            <span
                                                                className={cn(
                                                                    "ml-auto text-[10px] px-1.5 py-0.5 rounded uppercase font-medium flex-shrink-0",
                                                                    item.focStatus
                                                                        .toUpperCase()
                                                                        .includes(
                                                                            "UNRETURN"
                                                                        )
                                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                        : item.focStatus
                                                                              .toUpperCase()
                                                                              .includes(
                                                                                  "RETURN"
                                                                              )
                                                                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                          : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                                                )}
                                                            >
                                                                {item.focStatus}
                                                            </span>
                                                        )}
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

                {/* Unit Name + Type of FOC — shown together when IMEI selected */}
                {watchImei && watchImei !== "none" && watchImei !== "" && (
                    <FormField
                        control={form.control}
                        name={`${prefix}.unitName`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                    Unit Name
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        value={field.value || ""}
                                        readOnly
                                        className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors disabled:opacity-50 cursor-not-allowed"
                                    />
                                </FormControl>
                                <p className="text-xs text-blue-500 mt-1">
                                    Auto-filled from selected unit
                                </p>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />
                )}

                {/* Type of FOC — shown only when IMEI selected */}
                {watchImei && watchImei !== "none" && watchImei !== "" && (
                    <FormField
                        control={form.control}
                        name={`${prefix}.typeOfFoc`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                    Type of FOC
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        value={field.value || ""}
                                        readOnly
                                        className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors disabled:opacity-50 cursor-not-allowed"
                                    />
                                </FormControl>
                                <p className="text-xs text-blue-500 mt-1">
                                    Auto-filled from spreadsheet data
                                </p>
                                <FormMessage className="text-red-400" />
                            </FormItem>
                        )}
                    />
                )}

                {/* KOL Name */}
                <FormField
                    control={form.control}
                    name={`${prefix}.kolName`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" />
                                    KOL Name
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="John Doe"
                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />

                {/* KOL Phone */}
                <FormField
                    control={form.control}
                    name={`${prefix}.kolPhoneNumber`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                KOL Phone Number
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    inputMode="tel"
                                    placeholder="0812xxxxxxx"
                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />

                {/* KOL Address (full width) */}
                <FormField
                    control={form.control}
                    name={`${prefix}.kolAddress`}
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    KOL Address
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Full delivery address for the KOL"
                                    className="resize-none bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                    rows={2}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />

                {/* Delivery Date */}
                <FormField
                    control={form.control}
                    name={`${prefix}.deliveryDate`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                Delivery Date
                            </FormLabel>
                            <Popover
                                open={datePopoverOpen}
                                onOpenChange={setDatePopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                                !field.value &&
                                                    "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0 bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setDatePopoverOpen(false);
                                        }}
                                        disabled={(date) =>
                                            date < new Date("1900-01-01")
                                        }
                                        autoFocus
                                        className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-md border-neutral-200 dark:border-neutral-800"
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />

                {/* Type of Delivery */}
                <FormField
                    control={form.control}
                    name={`${prefix}.typeOfDelivery`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                Type of Delivery
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                disabled={loadingDelivery}
                            >
                                <FormControl>
                                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                        <SelectValue placeholder={loadingDelivery ? "Loading delivery types..." : "Select Delivery"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                    {displayDeliveryTypes.map((type) => (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                            className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer"
                                        >
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
