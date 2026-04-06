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
import { requestUnit } from "@/server/actions"
import type { InventoryItem } from "@/types/inventory"
import { requestFormSchema, RequestPayload } from "@/lib/validations"
import { DEVICE_CATEGORIES, REQUESTORS, DELIVERY_TYPES, FOC_TYPES } from "@/lib/constants"
import { RequestFormCampaign } from "./request/RequestFormCampaign"
import { RequestFormDevice } from "./request/RequestFormDevice"
import { RequestFormKol } from "./request/RequestFormKol"
import { RequestFormDelivery } from "./request/RequestFormDelivery"

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
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
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
        resolver: zodResolver(requestFormSchema),
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

    // Scroll to the first error field on invalid form submission
    function onInvalid(errors: any) {
        const firstErrorName = Object.keys(errors)[0]
        const element = document.getElementsByName(firstErrorName)[0]
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
        }
    }

    // Get icon for a category label
    function getCategoryIcon(name: string): string {
        const cat = DEVICE_CATEGORIES.find(c => c.label === name);
        return cat?.icon || "📦";
    }

    return (
        <>
            <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
                <AlertDialogContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">Cancel</AlertDialogCancel>
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

            <Dialog open={open} onOpenChange={(v) => {
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
            }}>
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
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 mt-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <RequestFormCampaign />

                            {/* ============================================================ */}
                            {/* 2-Step IMEI Selection: Category → Unit/IMEI                  */}
                            {/* ============================================================ */}
                            <RequestFormDevice
                                categories={categories}
                                filteredItems={filteredItems}
                                selectedCategory={selectedCategory}
                                handleCategoryChange={handleCategoryChange}
                                imeiPopoverOpen={imeiPopoverOpen}
                                setImeiPopoverOpen={setImeiPopoverOpen}
                                setAutoFilledFoc={setAutoFilledFoc}
                                extractFocType={extractFocType}
                            />

                            <RequestFormKol />
                            
                            <RequestFormDelivery 
                                autoFilledFoc={autoFilledFoc}
                            />

                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all mt-6">
                            {isSubmitting ? "Submitting Request..." : "Submit Request"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        </>
    )
}
