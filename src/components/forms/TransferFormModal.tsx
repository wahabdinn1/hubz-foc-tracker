"use client"

import { useState, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import {
    CalendarIcon,
    ArrowLeftRight,
    Check,
    ChevronsUpDown,
    Layers,
    Smartphone,
    AlertTriangle,
    User,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { transferUnit } from "@/server/actions"
import type { InventoryItem } from "@/types/inventory"
import { transferFormSchema, type TransferPayload } from "@/lib/validations"
import { DEVICE_CATEGORIES, REQUESTORS, FOC_TYPES, CAMPAIGNS } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Key(s) used in fullData for the FOC Type column (Column D in Step 1) */
const FOC_TYPE_KEYS = ["FOC TYPE", "TYPE OF FOC", "Type of FOC", "Foc Type"] as const;

function getDeviceCategory(unitName: string): string {
    const upper = unitName.toUpperCase().trim();
    for (const cat of DEVICE_CATEGORIES) {
        if (upper.startsWith(cat.prefix)) return cat.label;
    }
    return "Others";
}

function getCategoryIcon(name: string): string {
    const cat = DEVICE_CATEGORIES.find((c) => c.label === name);
    return cat?.icon || "📦";
}

function extractFocType(item: InventoryItem): string {
    if (!item.fullData) return "";
    for (const key of FOC_TYPE_KEYS) {
        const val = item.fullData[key];
        if (val && val.trim() !== "" && val.trim() !== "-") return val.trim().toUpperCase();
    }
    return "";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TransferFormModal({ loanedItems }: { loanedItems: InventoryItem[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false);
    const [imeiPopoverOpen, setImeiPopoverOpen] = useState(false);
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);

    // Build category → items map from LOANED items only
    const categoryMap = useMemo(() => {
        const map = new Map<string, InventoryItem[]>();

        loanedItems
            .filter((item) => {
                const status = item.statusLocation?.toUpperCase() || "";
                return status.includes("LOANED") || status.includes("ON KOL");
            })
            .forEach((item) => {
                const category = getDeviceCategory(item.unitName || "");
                const list = map.get(category) || [];
                list.push(item);
                map.set(category, list);
            });

        return map;
    }, [loanedItems]);

    // Sorted category names with counts
    const categories = useMemo(() => {
        const allCats = Array.from(categoryMap.entries()).map(([name, items]) => ({
            name,
            count: items.length,
        }));
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
    const form = useForm<z.infer<typeof transferFormSchema>>({
        resolver: zodResolver(transferFormSchema),
        defaultValues: {
            username: "",
            requestor: "",
            customRequestor: "",
            imei: "",
            unitName: "",
            typeOfFoc: "",
            currentHolder: "",
            kol2Name: "",
            kol2Phone: "",
            kol2Address: "",
            campaignName: "",
            customCampaign: "",
        },
    });

    const watchRequestor = form.watch("requestor");
    const watchCampaign = form.watch("campaignName");
    const watchImei = form.watch("imei");
    const watchCurrentHolder = form.watch("currentHolder");

    // Handle category change — reset IMEI selection
    function handleCategoryChange(value: string) {
        setSelectedCategory(value);
        form.setValue("imei", "");
        form.setValue("unitName", "");
        form.setValue("typeOfFoc", "");
        form.setValue("currentHolder", "");
    }

    // Reset all state when form resets
    function resetFormState() {
        setSelectedCategory("");
        form.reset();
    }

    // Submit handler
    async function onSubmit(values: z.infer<typeof transferFormSchema>) {
        setIsSubmitting(true);

        const payload: TransferPayload = {
            ...values,
            transferDate: format(values.transferDate, "yyyy-MM-dd"),
        };

        try {
            const result = await transferUnit(payload);

            if (result.success) {
                resetFormState();
                setOpen(false);
                toast.success("Transfer submitted successfully", {
                    description: `${values.unitName} transferred from ${values.currentHolder} to ${values.kol2Name}. Syncing with Google Sheets...`,
                });
                router.refresh();
            } else {
                const isConflict =
                    result.error?.includes("no longer on loan") ||
                    result.error?.includes("not found");

                if (isConflict) {
                    form.setValue("imei", "");
                    form.setValue("unitName", "");
                    form.setValue("currentHolder", "");
                    setSelectedCategory("");

                    toast.error("Transfer Not Possible", {
                        description: result.error,
                        icon: <AlertTriangle className="w-4 h-4" />,
                        duration: 8000,
                    });
                } else {
                    toast.error("Transfer failed", {
                        description: result.error,
                    });
                }
            }
        } catch {
            toast.error("Network error", {
                description:
                    "Could not reach the server. Please check your connection and try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    // Scroll to the first error field on invalid form submission
    function onInvalid(errors: Record<string, unknown>) {
        const firstErrorName = Object.keys(errors)[0];
        const element = document.getElementsByName(firstErrorName)[0];
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus();
        }
    }

    return (
        <>
            <AlertDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
            >
                <AlertDialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to
                            discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowDiscardDialog(false);
                                setOpen(false);
                                resetFormState();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={open}
                onOpenChange={(v) => {
                    if (!v) {
                        if (form.formState.isDirty) {
                            setShowDiscardDialog(true);
                        } else {
                            setOpen(false);
                            resetFormState();
                        }
                    } else {
                        setOpen(true);
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button className="bg-amber-600 hover:bg-amber-500 text-white gap-2 shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-all">
                        <ArrowLeftRight className="w-4 h-4" />
                        <span className="hidden sm:inline">Transfer</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white transition-colors overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                            Transfer Between KOL
                        </DialogTitle>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Transfer a loaned device from one KOL to another. This will record a return from the current holder and a new request for the new KOL.
                        </p>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                            className="space-y-6 mt-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ============================================= */}
                                {/* Username with Suffix (Full Width)              */}
                                {/* ============================================= */}
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                Username (Email)
                                            </FormLabel>
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
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                Requestor
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                                        <SelectValue placeholder="Select Requestor" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                    {REQUESTORS.map((req) => (
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

                                {/* Conditional Custom Requestor */}
                                {watchRequestor === "Other" ? (
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

                                {/* ============================================= */}
                                {/* 2-Step IMEI Selection: Category → Unit/IMEI    */}
                                {/* (Loaned devices only)                          */}
                                {/* ============================================= */}

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

                                {/* Step 2: IMEI/Unit Selection (only active after category) */}
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
                                                                : !field.value
                                                                    ? `Select from ${filteredItems.length} loaned unit${filteredItems.length !== 1 ? "s" : ""}...`
                                                                    : field.value}
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
                                                                No loaned units in this category.
                                                            </CommandEmpty>
                                                            <CommandGroup
                                                                heading={`${selectedCategory} — ${filteredItems.length} on loan`}
                                                            >
                                                                {filteredItems.map((item) => (
                                                                    <CommandItem
                                                                        value={`${item.imei} ${item.unitName} ${item.onHolder}`}
                                                                        key={item.imei}
                                                                        onSelect={() => {
                                                                            field.onChange(item.imei);
                                                                            form.setValue(
                                                                                "unitName",
                                                                                item.unitName || ""
                                                                            );
                                                                            form.setValue(
                                                                                "currentHolder",
                                                                                item.onHolder || ""
                                                                            );
                                                                            // Auto-fill FOC type
                                                                            const focType = extractFocType(item);
                                                                            if (focType) {
                                                                                form.setValue("typeOfFoc", focType, {
                                                                                    shouldValidate: true,
                                                                                });
                                                                            }
                                                                            setImeiPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                item.imei === field.value
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
                                                                            {item.onHolder && (
                                                                                <span className="text-xs text-amber-500 dark:text-amber-400 truncate">
                                                                                    Held by: {item.onHolder}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {item.focStatus && (
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

                                {/* Unit Name (Auto-filled, read-only) */}
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
                                                <p className="text-xs text-blue-500 mt-1">
                                                    Auto-filled from selected unit
                                                </p>
                                            )}
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* Current Holder (Read-only, auto-filled) */}
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

                                {/* Type of FOC (Auto-filled, editable) */}
                                <FormField
                                    control={form.control}
                                    name="typeOfFoc"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                Type of FOC
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                                        <SelectValue placeholder="Select FOC Type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                    {FOC_TYPES.map((type) => (
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

                                {/* ============================================= */}
                                {/* New Holder (KOL 2) Section                     */}
                                {/* ============================================= */}

                                <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <ArrowLeftRight className="w-4 h-4" />
                                        New Holder (KOL 2)
                                    </h3>
                                </div>

                                {/* Transfer Date */}
                                <FormField
                                    control={form.control}
                                    name="transferDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                Transfer Date
                                            </FormLabel>
                                            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
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
                                                        initialFocus
                                                        className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-md border-neutral-200 dark:border-neutral-800"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* Transfer Reason / Campaign */}
                                <FormField
                                    control={form.control}
                                    name="campaignName"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                Transfer Reason / Campaign
                                            </FormLabel>
                                            <Popover
                                                open={campaignPopoverOpen}
                                                onOpenChange={setCampaignPopoverOpen}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal",
                                                                !field.value && "text-neutral-500"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? CAMPAIGNS.find((campaign) => campaign === field.value)
                                                                : "Select Campaign"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search campaign..." />
                                                        <CommandList>
                                                            <CommandEmpty>No campaign found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {CAMPAIGNS.map((campaign) => (
                                                                    <CommandItem
                                                                        key={campaign}
                                                                        value={campaign}
                                                                        onSelect={() => {
                                                                            form.setValue("campaignName", campaign)
                                                                            setCampaignPopoverOpen(false)
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                campaign === field.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {campaign}
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

                                {/* Conditional Custom Campaign */}
                                {watchCampaign === "Other" && (
                                    <FormField
                                        control={form.control}
                                        name="customCampaign"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                    Custom Campaign Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter custom campaign name"
                                                        className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-400" />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                {/* KOL 2 Name */}
                                <FormField
                                    control={form.control}
                                    name="kol2Name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                KOL 2 Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="New holder's name"
                                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* KOL 2 Phone */}
                                <FormField
                                    control={form.control}
                                    name="kol2Phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                KOL 2 Phone Number
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="0812xxxxxxx"
                                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />

                                {/* KOL 2 Address (Full Width) */}
                                <FormField
                                    control={form.control}
                                    name="kol2Address"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                                KOL 2 Address
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Full delivery address for the new KOL"
                                                    className="resize-none bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-400" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-all mt-6"
                            >
                                {isSubmitting
                                    ? "Processing Transfer..."
                                    : "Submit Transfer"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
