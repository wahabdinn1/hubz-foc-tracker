"use client"

import { useState, useMemo, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { ArrowLeftRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
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
import { transferUnit } from "@/server/mutations"
import type { InventoryItem } from "@/types/inventory"
import { transferFormSchema, type TransferPayload } from "@/lib/validations"
import { REQUESTORS, CAMPAIGNS } from "@/lib/constants"
import { DiscardGuardDialog } from "@/components/shared/DiscardGuardDialog"
import { UsernameEmailInput } from "./shared/UsernameEmailInput"
import { useScrollToFirstError } from "@/hooks/useScrollToFirstError"
import { useDeviceCategories } from "@/hooks/useDeviceCategories"
import { TransferFormDevice } from "./transfer/TransferFormDevice"
import { TransferFormNewKol } from "./transfer/TransferFormNewKol"
import { TransferFormDetails } from "./transfer/TransferFormDetails"

export function TransferFormModal({ loanedItems }: { loanedItems: InventoryItem[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [imeiPopoverOpen, setImeiPopoverOpen] = useState(false);

    const filterLoaned = useCallback((item: InventoryItem) => {
        const status = item.statusLocation?.toUpperCase() || "";
        return status.includes("LOANED") || status.includes("ON KOL");
    }, [])

    const { categories, getFilteredItems } = useDeviceCategories(loanedItems, filterLoaned)

    const filteredItems = useMemo(() => getFilteredItems(selectedCategory), [selectedCategory, getFilteredItems])

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

    function handleCategoryChange(value: string) {
        setSelectedCategory(value);
        form.setValue("imei", "");
        form.setValue("unitName", "");
        form.setValue("typeOfFoc", "");
        form.setValue("currentHolder", "");
    }

    function resetFormState() {
        setSelectedCategory("");
        form.reset();
    }

    const onInvalid = useScrollToFirstError()

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
                                <UsernameEmailInput />

                                <TransferFormDevice
                                    requestor={watchRequestor}
                                    categories={categories}
                                    filteredItems={filteredItems}
                                    selectedCategory={selectedCategory}
                                    handleCategoryChange={handleCategoryChange}
                                    imeiPopoverOpen={imeiPopoverOpen}
                                    setImeiPopoverOpen={setImeiPopoverOpen}
                                />

                                <TransferFormDetails />

                                <TransferFormNewKol />
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
