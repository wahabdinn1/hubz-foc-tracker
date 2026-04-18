"use client"

import { useFormContext } from "react-hook-form"
import { Check, ChevronsUpDown, Layers, Smartphone, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { getDeviceCategory, getCategoryIcon, extractFocType } from "@/lib/device-utils"
import type { InventoryItem } from "@/types/inventory"
import { useDropdownOptions } from "@/hooks/useDropdownOptions"

interface CategoryInfo {
    name: string
    count: number
}

interface TransferFormDeviceProps {
    requestor: string
    categories: CategoryInfo[]
    filteredItems: InventoryItem[]
    selectedCategory: string
    handleCategoryChange: (value: string) => void
    imeiPopoverOpen: boolean
    setImeiPopoverOpen: (open: boolean) => void
}

export function TransferFormDevice({
    requestor,
    categories,
    filteredItems,
    selectedCategory,
    handleCategoryChange,
    imeiPopoverOpen,
    setImeiPopoverOpen,
}: TransferFormDeviceProps) {
    const form = useFormContext()
    const watchImei = form.watch("imei")
    const watchCurrentHolder = form.watch("currentHolder")
    
    const { options: requestorOptions, isLoading: loadingRequestors } = useDropdownOptions("REQUESTOR");
    const displayRequestors = [...new Set([...requestorOptions.map(o => o.value), "Other"])];

    return (
        <>
            <FormField
                control={form.control}
                name="requestor"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            Requestor
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined} disabled={loadingRequestors}>
                            <FormControl>
                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                    <SelectValue placeholder={loadingRequestors ? "Loading requestors..." : "Select Requestor"} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                {displayRequestors.map((req) => (
                                    <SelectItem
                                        key={req}
                                        value={req}
                                        className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer"
                                    >
                                        {req}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            {requestor === "Other" ? (
                <FormField
                    control={form.control}
                    name="customRequestor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                Custom Requestor
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter custom name"
                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />
            ) : (
                <div className="hidden md:block" />
            )}

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
                        Select a category to see loaned units
                    </p>
                )}
            </FormItem>

            <FormField
                control={form.control}
                name="imei"
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
                                            : !field.value
                                                ? `Select from ${filteredItems.length} loaned unit${filteredItems.length !== 1 ? "s" : ""}...`
                                                : field.value}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search IMEI or Unit Name..." />
                                    <CommandList>
                                        <CommandEmpty>No loaned units in this category.</CommandEmpty>
                                        <CommandGroup heading={`${selectedCategory} — ${filteredItems.length} on loan`}>
                                            {filteredItems.map((item) => (
                                                <CommandItem
                                                    value={`${item.imei} ${item.unitName} ${item.onHolder}`}
                                                    key={item.imei}
                                                    onSelect={() => {
                                                        field.onChange(item.imei);
                                                        form.setValue("unitName", item.unitName || "");
                                                        form.setValue("currentHolder", item.onHolder || "");
                                                        const focType = extractFocType(item);
                                                        if (focType) {
                                                            form.setValue("typeOfFoc", focType, { shouldValidate: true });
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
                                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                        <span className="font-medium text-sm truncate">{item.unitName}</span>
                                                        <span className="text-xs text-neutral-400 font-mono truncate">{item.imei}</span>
                                                        {item.onHolder && (
                                                            <span className="text-xs text-amber-500 dark:text-amber-400 truncate">
                                                                Held by: {item.onHolder}
                                                            </span>
                                                        )}
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

            <FormField
                control={form.control}
                name="unitName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            Unit Name
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Auto-filled from selection"
                                className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500 disabled:opacity-60"
                                disabled={!!watchImei}
                                {...field}
                            />
                        </FormControl>
                        {watchImei && (
                            <p className="text-xs text-blue-500 mt-1">Auto-filled from selected unit</p>
                        )}
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="currentHolder"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                Current Holder (KOL 1)
                            </span>
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="Auto-filled from selection"
                                className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-neutral-900 dark:text-neutral-100 transition-colors disabled:opacity-80 font-medium"
                                disabled
                                {...field}
                            />
                        </FormControl>
                        {watchCurrentHolder && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Device will be returned from this KOL
                            </p>
                        )}
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
        </>
    )
}
