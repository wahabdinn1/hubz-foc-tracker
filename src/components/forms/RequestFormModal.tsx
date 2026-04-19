"use client"

import { useState, useMemo, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
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
import { requestUnits } from "@/server/mutations"
import type { InventoryItem } from "@/types/inventory"
import { requestFormSchema, RequestPayload } from "@/lib/validations"
import { RequestFormCampaign } from "./request/RequestFormCampaign"
import { RequestFormDeviceRow } from "./request/RequestFormDeviceRow"
import { DiscardGuardDialog } from "@/components/shared/DiscardGuardDialog"
import { useScrollToFirstError } from "@/hooks/useScrollToFirstError"
import { hasFilledFields } from "@/hooks/useHasFilledFields"
import { useFormPersistence } from "@/hooks/useFormPersistence"

export function RequestFormModal({ availableItems }: { availableItems: InventoryItem[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof requestFormSchema>>({
        resolver: zodResolver(requestFormSchema),
        defaultValues: {
            username: "",
            requestor: "",
            customRequestor: "",
            campaignName: "",
            customCampaign: "",
            devices: [
                {
                    unitName: "",
                    imeiIfAny: "",
                    kolName: "",
                    kolAddress: "",
                    kolPhoneNumber: "",
                    typeOfDelivery: "",
                    typeOfFoc: "",
                    deliveryDate: undefined as unknown as Date,
                },
            ],
        },
    })

    const { clearDraft } = useFormPersistence("request-form", form)

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "devices",
    })

    const watchedDevices = useWatch({ control: form.control, name: "devices" });

    const selectedImeis = useMemo(() => {
        const imeis = new Set<string>()
        for (const device of watchedDevices || []) {
            const imei = device?.imeiIfAny?.trim()
            if (imei && imei !== "none") imeis.add(imei)
        }
        return imeis
    }, [watchedDevices])

    const resetFormState = useCallback(() => {
        form.reset()
    }, [form])

    async function onSubmit(values: z.infer<typeof requestFormSchema>) {
        setIsSubmitting(true)

        const payload: RequestPayload = {
            username: values.username,
            requestor: values.requestor,
            customRequestor: values.customRequestor,
            campaignName: values.campaignName,
            customCampaign: values.customCampaign,
            devices: values.devices.map(d => ({
                ...d,
                deliveryDate: format(d.deliveryDate, "yyyy-MM-dd"),
            })),
        }

        try {
            const result = await requestUnits(payload)

            if (result.success) {
                clearDraft()
                setOpen(false)
                toast.success("Request submitted successfully", {
                    description: `${payload.devices.length} device(s) synced with Google Sheets...`,
                })
                router.refresh()
            } else {
                const isConflict =
                    result.error?.includes("just been taken") ||
                    result.error?.includes("collision detected")

                if (isConflict) {
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
        clearDraft()
    }, [resetFormState, clearDraft])

    return (
        <>
            <DiscardGuardDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onDiscard={handleDiscard}
            />

            <Dialog open={open} onOpenChange={(v) => {
                if (!v) {
                    const values = form.getValues();
                    const shouldWarn = form.formState.isDirty || hasFilledFields(values);
                    if (shouldWarn) {
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
            <DialogContent className="sm:max-w-3xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white transition-colors overflow-y-auto max-h-[90vh] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Outbound (Request) Form</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 mt-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RequestFormCampaign />
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <RequestFormDeviceRow
                                    key={field.id}
                                    index={index}
                                    availableItems={availableItems}
                                    selectedImeis={selectedImeis}
                                    onRemove={() => remove(index)}
                                    canRemove={fields.length > 1}
                                />
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                append({
                                    unitName: "",
                                    imeiIfAny: "",
                                    kolName: "",
                                    kolAddress: "",
                                    kolPhoneNumber: "",
                                    typeOfDelivery: "",
                                    typeOfFoc: "",
                                    deliveryDate: undefined as unknown as Date,
                                })
                            }
                            className="w-full border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Device
                        </Button>

                        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all mt-6">
                            {isSubmitting
                                ? `Submitting ${fields.length} Request(s)...`
                                : `Submit ${fields.length} Request${fields.length > 1 ? "s" : ""}`}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        </>
    )
}
