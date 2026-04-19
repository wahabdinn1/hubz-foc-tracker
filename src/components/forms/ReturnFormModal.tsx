"use client"

import { useState, useCallback, useEffect } from "react"
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

import { cn } from "@/lib/utils"
import { MultiImeiReturnSelector } from "./MultiImeiReturnSelector"
import { DiscardGuardDialog } from "@/components/shared/DiscardGuardDialog"
import { UsernameEmailInput } from "./shared/UsernameEmailInput"
import { useScrollToFirstError } from "@/hooks/useScrollToFirstError"
import { resolveFocTypeWithMatch } from "@/lib/form-utils"
import { hasFilledFields } from "@/hooks/useHasFilledFields"
import { useFormPersistence } from "@/hooks/useFormPersistence"

const returnFormSchema = z.object({
    username: z.string().min(1, "Username is required"),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

function resolveEmail(item: InventoryItem): string {
    return item.step3Data?.email || "-"
}

function resolveRequestor(item: InventoryItem): string {
    return item.step3Data?.requestor || "-"
}

function resolveFocType(item: InventoryItem): string {
    const raw = item.step3Data?.typeOfFoc || item.focType || ""
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
    const rawFoc = resolveFocType(item)
    const typeOfFoc = resolveFocTypeWithMatch(rawFoc)

    return {
        username,
        requestor: rawReq || "-",
        customRequestor: undefined,
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

    const { clearDraft } = useFormPersistence("return-form", form)

    // Also persist selectedItems (since it's not part of the RHF form state)
    useEffect(() => {
        const saved = localStorage.getItem("return-selected-items")
        if (saved) {
            try {
                const { items, timestamp } = JSON.parse(saved)
                if (Date.now() - timestamp < 60000) {
                    setSelectedItems(items)
                } else {
                    localStorage.removeItem("return-selected-items")
                }
            } catch (e) {
                console.error("Failed to load selected items draft", e)
            }
        }
    }, [])

    useEffect(() => {
        if (selectedItems.length > 0) {
            localStorage.setItem("return-selected-items", JSON.stringify({
                items: selectedItems,
                timestamp: Date.now()
            }))
        } else {
            localStorage.removeItem("return-selected-items")
        }
    }, [selectedItems])

    const clearAllDrafts = useCallback(() => {
        clearDraft()
        localStorage.removeItem("return-selected-items")
    }, [clearDraft])

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
                    clearAllDrafts()
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
                clearAllDrafts()
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
        clearAllDrafts()
    }, [form, clearAllDrafts])

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
                <Button className="bg-green-600 hover:bg-green-500 text-white gap-2 shadow-[0_0_20px_rgba(22,163,74,0.4)] transition-all">
                    <Undo2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Inbound (Return)</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white transition-colors overflow-y-auto max-h-[90vh] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Undo2 className="w-5 h-5 text-green-500" />
                        Inbound (Return) Form
                    </DialogTitle>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Record the return of loaned devices. You can scan or select multiple units at once to batch process returns.
                    </p>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col gap-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UsernameEmailInput />

                            <MultiImeiReturnSelector
                                loanedItems={loanedItems}
                                selectedItems={selectedItems}
                                onSelectionChange={setSelectedItems}
                            />
                        </div>

                        {selectedItems.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Smartphone className="size-4" />
                                    <span>Units to Return ({selectedItems.length})</span>
                                </div>
                                <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                                    {selectedItems.map((item) => (
                                        <div
                                            key={item.imei}
                                            className="group p-3 rounded-xl bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 min-w-0 flex flex-col gap-2">
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
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Mail className="size-3 shrink-0" />
                                                            <span className="truncate">{resolveEmail(item)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-500">
                                                            <MapPin className="size-3 shrink-0" />
                                                            <span className="truncate">From: {item.onHolder || "-"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <User className="size-3 shrink-0" />
                                                            <span className="truncate">{resolveRequestor(item)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Phone className="size-3 shrink-0" />
                                                            <span className="truncate">{resolvePhone(item)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedItems(prev => prev.filter(i => i.imei !== item.imei))}
                                                    className="size-11 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                    aria-label={`Remove ${item.unitName}`}
                                                >
                                                    <X className="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmitting || selectedItems.length === 0} className="w-full bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all mt-6">
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
