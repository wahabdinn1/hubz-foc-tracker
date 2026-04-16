"use client"

import { useState, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Undo2, X, Smartphone, User, Phone, MapPin, Mail } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { returnUnit, returnUnits } from "@/server/mutations"
import type { InventoryItem } from "@/types/inventory"
import { ReturnPayload } from "@/lib/validations"
import { FOC_TYPES, EMAIL_DOMAIN } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { MultiImeiReturnSelector } from "./MultiImeiReturnSelector"
import { DiscardGuardDialog } from "@/components/shared/DiscardGuardDialog"
import { UsernameEmailInput } from "./shared/UsernameEmailInput"
import { useScrollToFirstError } from "@/hooks/useScrollToFirstError"
import { resolveRequestorWithFallback, resolveFocTypeWithMatch } from "@/lib/form-utils"
import { hasFilledFields } from "@/hooks/useHasFilledFields"

const returnFormSchema = z.object({
    username: z.string().min(1, "Username is required"),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

function resolveEmail(item: InventoryItem): string {
    return item.step3Data?.email || "-"
}

function resolveRequestor(item: InventoryItem): string {
    const raw = item.step3Data?.requestor || ""
    if (!raw) return "-"
    const { requestor } = resolveRequestorWithFallback(raw)
    return requestor === "Other" ? item.step3Data?.requestor || "-" : requestor
}

function resolveFocType(item: InventoryItem): string {
    const raw = item.step3Data?.typeOfFoc || item.step1Data?.focType || ""
    if (!raw) return "-"
    return resolveFocTypeWithMatch(raw)
}

function resolvePhone(item: InventoryItem): string {
    return item.step3Data?.kolPhone || "-"
}

function resolveAddress(item: InventoryItem): string {
    return item.step3Data?.kolAddress || "-"
}

function buildReturnPayload(item: InventoryItem, username: string): ReturnPayload {
    const rawReq = item.step3Data?.requestor || ""
    const { requestor, customRequestor } = resolveRequestorWithFallback(rawReq)
    const rawFoc = resolveFocType(item)
    const typeOfFoc = resolveFocTypeWithMatch(rawFoc)

    return {
        username,
        requestor,
        customRequestor: customRequestor || undefined,
        unitName: item.unitName || "",
        imei: item.imei || "",
        fromKol: item.onHolder || "",
        kolAddress: resolveAddress(item),
        kolPhoneNumber: resolvePhone(item),
        typeOfFoc,
    }
}

export function ReturnFormModal({ loanedItems }: { loanedItems: InventoryItem[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [showDiscardDialog, setShowDiscardDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([])

    const form = useForm<ReturnFormValues>({
        resolver: zodResolver(returnFormSchema),
        defaultValues: {
            username: "",
        },
    })

    const onInvalid = useScrollToFirstError()

    async function onSubmit(values: ReturnFormValues) {
        if (selectedItems.length === 0) {
            toast.error("No units selected", {
                description: "Please select at least one unit to return.",
            })
            return
        }

        setIsSubmitting(true)

        if (selectedItems.length === 1) {
            const payload = buildReturnPayload(selectedItems[0], values.username)

            try {
                const result = await returnUnit(payload)
                if (result.success) {
                    toast.success("Return logged — syncing with Google Sheets...")
                    form.reset()
                    setSelectedItems([])
                    setOpen(false)
                    router.refresh()
                } else {
                    toast.error("Return failed to save", { description: result.error })
                }
            } catch {
                toast.error("Network error", {
                    description: "Could not reach the server. Please check your connection and try again.",
                })
            } finally {
                setIsSubmitting(false)
            }
            return
        }

        const payloadArray = selectedItems.map((item) => buildReturnPayload(item, values.username))

        try {
            const result = await returnUnits(payloadArray)
            if (result.success) {
                toast.success(`Successfully returned ${selectedItems.length} units.`)
                form.reset()
                setSelectedItems([])
                setOpen(false)
                router.refresh()
            } else {
                toast.error("Batch return failed", { description: result.error })
            }
        } catch {
            toast.error("Network error", {
                description: "Could not reach the server. Please check your connection and try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const isDirty = form.formState.isDirty || selectedItems.length > 0 || hasFilledFields(form.getValues())

    const handleDiscard = useCallback(() => {
        setShowDiscardDialog(false)
        setOpen(false)
        form.reset()
        setSelectedItems([])
    }, [form])

    return (
        <>
            <DiscardGuardDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onDiscard={handleDiscard}
            />

            <Dialog open={open} onOpenChange={(v) => {
                if (!v) {
                    if (isDirty) {
                        setShowDiscardDialog(true);
                    } else {
                        setOpen(false);
                        form.reset();
                        setSelectedItems([]);
                    }
                } else {
                    setOpen(true);
                }
            }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white text-neutral-900 dark:text-white gap-2 transition-all">
                    <Undo2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Inbound (Return)</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white transition-colors overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Inbound (Return) Form</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UsernameEmailInput />

                            <MultiImeiReturnSelector
                                loanedItems={loanedItems}
                                selectedItems={selectedItems}
                                onSelectionChange={setSelectedItems}
                            />
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    <Smartphone className="w-4 h-4" />
                                    <span>Units to Return ({selectedItems.length})</span>
                                </div>
                                <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                                    {selectedItems.map((item) => (
                                        <div
                                            key={item.imei}
                                            className="group p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{item.unitName || "Unknown Unit"}</span>
                                                        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{item.imei}</span>
                                                        {item.focStatus && (
                                                            <Badge variant="outline" className={cn(
                                                                "text-[10px] px-1.5 py-0",
                                                                item.focStatus.toUpperCase().includes("UNRETURN")
                                                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                                                    : item.focStatus.toUpperCase().includes("RETURN")
                                                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                                    : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20"
                                                            )}>
                                                                {item.focStatus}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                                            <Mail className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{resolveEmail(item)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                            <MapPin className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">From: {item.onHolder || "-"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                                            <User className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{resolveRequestor(item)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                                            <Phone className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{resolvePhone(item)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedItems(prev => prev.filter(i => i.imei !== item.imei))}
                                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                                                    aria-label={`Remove ${item.unitName}`}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmitting || selectedItems.length === 0} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all mt-6">
                            {isSubmitting
                                ? "Submitting Return..."
                                : selectedItems.length === 0
                                    ? "Select units to return"
                                    : selectedItems.length === 1
                                        ? "Submit Return"
                                        : `Submit Return (${selectedItems.length} units)`}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        </>
    )
}
