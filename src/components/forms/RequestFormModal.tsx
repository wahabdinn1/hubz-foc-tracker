"use client"

import { useState, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Check, ChevronsUpDown, Layers, Smartphone, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { requestUnit } from "@/server/actions"
import type { InventoryItem } from "@/types/inventory"
import { requestFormSchema, RequestPayload } from "@/lib/validations"

// ---------------------------------------------------------------------------
// Device Category Logic
// ---------------------------------------------------------------------------

const DEVICE_CATEGORIES = [
    { prefix: "G-S", label: "S Series", icon: "📱" },
    { prefix: "G-A", label: "A Series", icon: "📱" },
    { prefix: "G-T", label: "Tab", icon: "📋" },
    { prefix: "G-B", label: "Buds", icon: "🎧" },
    { prefix: "G-W", label: "Wearable", icon: "⌚" },
] as const;

/** Key(s) used in fullData for the FOC Type column (Column D in Step 1) */
const FOC_TYPE_KEYS = ["FOC TYPE", "TYPE OF FOC", "Type of FOC", "Foc Type"] as const;

function getDeviceCategory(unitName: string): string {
    const upper = unitName.toUpperCase().trim();
    for (const cat of DEVICE_CATEGORIES) {
        if (upper.startsWith(cat.prefix)) return cat.label;
    }
    return "Others";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RequestFormModal({ availableItems }: { availableItems: InventoryItem[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [imeiPopoverOpen, setImeiPopoverOpen] = useState(false)

    // Build category → items map from AVAILABLE items only
    const categoryMap = useMemo(() => {
        const map = new Map<string, InventoryItem[]>();

        availableItems
            .filter(item => item.statusLocation?.toUpperCase().includes("AVAILABLE"))
            .forEach(item => {
                const category = getDeviceCategory(item.unitName || "");
                const list = map.get(category) || [];
                list.push(item);
                map.set(category, list);
            });

        return map;
    }, [availableItems]);

    // Sorted category names with counts
    const categories = useMemo(() => {
        const allCats = Array.from(categoryMap.entries()).map(([name, items]) => ({
            name,
            count: items.length,
        }));
        // Sort so defined categories come first alphabetically, "Others" last
        return allCats.sort((a, b) => {
            if (a.name === "Others") return 1;
            if (b.name === "Others") return -1;
            return a.name.localeCompare(b.name);
        });
    }, [categoryMap]);

    // Items filtered by selected category
    const filteredItems = useMemo(() => {
        if (!selectedCategory) return [];
        return categoryMap.get(selectedCategory) || [];
    }, [selectedCategory, categoryMap]);

    // React Hook Form setup
    const form = useForm<z.infer<typeof requestFormSchema>>({
        resolver: zodResolver(requestFormSchema as any),
        defaultValues: {
            username: "",
            requestor: "",
            customRequestor: "",
            campaignName: "",
            unitName: "",
            imeiIfAny: "",
            kolName: "",
            kolAddress: "",
            kolPhoneNumber: "",
            typeOfDelivery: "",
            typeOfFoc: "",
        },
    })

    const watchRequestor = form.watch("requestor")
    const watchImei = form.watch("imeiIfAny")
    const watchTypeOfFoc = form.watch("typeOfFoc")
    const [autoFilledFoc, setAutoFilledFoc] = useState<string | null>(null);

    // Handle category change — reset IMEI selection
    function handleCategoryChange(value: string) {
        setSelectedCategory(value);
        form.setValue("imeiIfAny", "");
        form.setValue("unitName", "");
        form.setValue("typeOfFoc", "");
        setAutoFilledFoc(null);
    }

    /** Read FOC TYPE from an item's fullData (Column D in sheet) */
    function extractFocType(item: InventoryItem): string {
        if (!item.fullData) return "";
        for (const key of FOC_TYPE_KEYS) {
            const val = item.fullData[key];
            if (val && val.trim() !== "" && val.trim() !== "-") return val.trim().toUpperCase();
        }
        return "";
    }

    // Reset all category/IMEI state when form resets
    function resetFormState() {
        setSelectedCategory("");
        form.reset();
    }

    // Submit handler with 409 conflict handling
    async function onSubmit(values: z.infer<typeof requestFormSchema>) {
        setIsSubmitting(true)

        const payload: RequestPayload = {
            ...values,
            deliveryDate: format(values.deliveryDate, "yyyy-MM-dd"),
        }

        try {
            const result = await requestUnit(payload)

            if (result.success) {
                resetFormState()
                setOpen(false)
                toast.success("Request submitted successfully", {
                    description: "Syncing with Google Sheets...",
                })
                router.refresh()
            } else {
                // Handle 409-style conflict errors from the server action
                const isConflict =
                    result.error?.includes("just been taken") ||
                    result.error?.includes("collision detected");

                if (isConflict) {
                    // Reset IMEI selection immediately
                    form.setValue("imeiIfAny", "");
                    form.setValue("unitName", "");
                    setSelectedCategory("");

                    toast.error("Unit Unavailable", {
                        description: result.error,
                        icon: <AlertTriangle className="w-4 h-4" />,
                        duration: 8000,
                    })
                } else {
                    toast.error("Request failed to save", {
                        description: result.error,
                    })
                }
            }
        } catch {
            toast.error("Network error", {
                description: "Could not reach the server. Please check your connection and try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get icon for a category label
    function getCategoryIcon(name: string): string {
        const cat = DEVICE_CATEGORIES.find(c => c.label === name);
        return cat?.icon || "📦";
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetFormState(); }}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                    <Plus className="w-4 h-4" />
                    New Request
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white transition-colors overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Outbound (Request) Form</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Campaign Name (Full Width) */}
                            <FormField
                                control={form.control}
                                name="campaignName"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Campaign Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Galaxy S24 Ultra Content" className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Username with Suffix (Full Width) */}
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Username (Email)</FormLabel>
                                        <FormControl>
                                            <div className="flex rounded-md shadow-sm">
                                                <Input
                                                    placeholder="wahabdin.sangadji"
                                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors rounded-r-none focus-visible:ring-blue-500 flex-1 min-w-0"
                                                    {...field}
                                                />
                                                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-neutral-300 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm">
                                                    @wppmedia.com
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Requestor Select */}
                            <FormField
                                control={form.control}
                                name="requestor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Requestor</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                                    <SelectValue placeholder="Select Requestor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                {["Abigail", "Khalida", "Oliv", "Salma", "Tashya", "Venni", "Other"].map((req) => (
                                                    <SelectItem key={req} value={req} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer">
                                                        {req}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Conditional Custom Requestor */}
                            {watchRequestor === "Other" ? (
                                <FormField
                                    control={form.control}
                                    name="customRequestor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Custom Requestor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter custom name" className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500" {...field} />
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="hidden md:block"></div>
                            )}

                            {/* ============================================================ */}
                            {/* 2-Step IMEI Selection: Category → Unit/IMEI                  */}
                            {/* ============================================================ */}

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
                                    <FormItem>
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

                            {/* KOL Name */}
                            <FormField
                                control={form.control}
                                name="kolName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">KOL Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* KOL Phone Number */}
                            <FormField
                                control={form.control}
                                name="kolPhoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">KOL Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="0812xxxxxxx" className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* KOL Address (Full Width) */}
                            <FormField
                                control={form.control}
                                name="kolAddress"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">KOL Address</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Full delivery address for the KOL"
                                                className="resize-none bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                                rows={3}
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
                                name="deliveryDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Delivery Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                                                            !field.value && "text-muted-foreground"
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
                                            <PopoverContent className="w-auto p-0 bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                    className="bg-neutral-950 text-white rounded-md border-neutral-800"
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
                                name="typeOfDelivery"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Type of Delivery</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                                    <SelectValue placeholder="Select Delivery" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                {["BLUEBIRD", "TIKI"].map((type) => (
                                                    <SelectItem key={type} value={type} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer">
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Type of FOC (auto-filled from category, still editable) */}
                            <FormField
                                control={form.control}
                                name="typeOfFoc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Type of FOC</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                                    <SelectValue placeholder="Select FOC Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                {["ACCESORIES", "APS", "BUDS", "HANDPHONE", "PACKAGES", "RUGGED", "TAB", "WEARABLES"].map((type) => (
                                                    <SelectItem key={type} value={type} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer">
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {autoFilledFoc && watchTypeOfFoc === autoFilledFoc && (
                                            <p className="text-xs text-blue-500 mt-1">Auto-filled from spreadsheet data</p>
                                        )}
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all mt-6">
                            {isSubmitting ? "Submitting Request..." : "Submit Request"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
