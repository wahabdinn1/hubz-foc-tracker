"use client"

import { useState, useMemo, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Plus, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
} from "@/components/ui/form"
import { requestUnit } from "@/server/mutations"
import type { InventoryItem } from "@/types/inventory"
import { requestFormSchema, RequestPayload } from "@/lib/validations"
import { getDeviceCategory, extractFocType } from "@/lib/device-utils"
import { RequestFormCampaign } from "./request/RequestFormCampaign"
import { RequestFormDevice } from "./request/RequestFormDevice"
import { RequestFormKol } from "./request/RequestFormKol"
import { RequestFormDelivery } from "./request/RequestFormDelivery"
import { DiscardGuardDialog } from "@/components/shared/DiscardGuardDialog"
import { UsernameEmailInput } from "./shared/UsernameEmailInput"
import { useScrollToFirstError } from "@/hooks/useScrollToFirstError"
import { useDeviceCategories } from "@/hooks/useDeviceCategories"

export function RequestFormModal({ availableItems }: { availableItems: InventoryItem[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("")
    const [imeiPopoverOpen, setImeiPopoverOpen] = useState(false)

    const filterAvailable = useCallback((item: InventoryItem) => {
        return item.statusLocation?.toUpperCase().includes("AVAILABLE") ?? false
    }, [])

    const { categories, getFilteredItems } = useDeviceCategories(availableItems, filterAvailable)

    const filteredItems = useMemo(() => getFilteredItems(selectedCategory), [selectedCategory, getFilteredItems])

    // React Hook Form setup
    const form = useForm<z.infer<typeof requestFormSchema>>({
        resolver: zodResolver(requestFormSchema),
        defaultValues: {
            username: "",
            requestor: "",
            customRequestor: "",
            campaignName: "",
            customCampaign: "",
            unitName: "",
            imeiIfAny: "",
            kolName: "",
            kolAddress: "",
            kolPhoneNumber: "",
            typeOfDelivery: "",
            typeOfFoc: "",
        },
    })

    const [autoFilledFoc, setAutoFilledFoc] = useState<string | null>(null);

    // Handle category change — reset IMEI selection
    function handleCategoryChange(value: string) {
        setSelectedCategory(value);
        form.setValue("imeiIfAny", "");
        form.setValue("unitName", "");
        form.setValue("typeOfFoc", "");
        setAutoFilledFoc(null);
    }

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

    const onInvalid = useScrollToFirstError()

    const handleDiscard = useCallback(() => {
        setShowDiscardDialog(false)
        setOpen(false)
        resetFormState()
    }, [resetFormState])

    return (
        <>
            <DiscardGuardDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onDiscard={handleDiscard}
            />

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
                        <span className="hidden sm:inline">New Request</span>
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
