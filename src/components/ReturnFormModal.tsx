"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Undo2 } from "lucide-react"
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
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { returnUnit, InventoryItem } from "@/server/actions"
import { returnSchema, ReturnPayload } from "@/lib/validations"

export function ReturnFormModal({ loanedItems }: { loanedItems: InventoryItem[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof returnSchema>>({
        resolver: zodResolver(returnSchema as any),
        defaultValues: {
            username: "",
            requestor: "",
            customRequestor: "",
            unitName: "",
            imei: "",
            fromKol: "",
            kolAddress: "",
            kolPhoneNumber: "",
            typeOfFoc: "",
        },
    })

    const watchRequestor = form.watch("requestor")

    async function onSubmit(values: z.infer<typeof returnSchema>) {
        setIsSubmitting(true)

        const payload: ReturnPayload = values;

        // Optimistic: close modal and show success immediately
        form.reset()
        setOpen(false)
        toast.success("Return logged — syncing with Google Sheets...")

        const result = await returnUnit(payload)
        setIsSubmitting(false)

        if (result.success) {
            router.refresh()
        } else {
            toast.error("Return failed to save", {
                description: result.error,
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white text-neutral-900 dark:text-white gap-2 transition-all">
                    <Undo2 className="w-4 h-4" />
                    Inbound (Return)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white transition-colors overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Inbound (Return) Form</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors text-neutral-200">
                                                    <SelectValue placeholder="Select Requestor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                {["Abigail", "Khalida", "Oliv", "Salma", "Tashya", "Venni", "Other"].map((req) => (
                                                    <SelectItem key={req} value={req} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer transition-colors">
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

                            {/* IMEI Selection */}
                            <FormField
                                control={form.control}
                                name="imei"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">IMEI/SN - Unit Name - KOL Holder</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                // Sync Unit Name and KOL Holder fields
                                                const selectedUnit = loanedItems.find(item => item.imei === val)
                                                if (selectedUnit) {
                                                    form.setValue("unitName", selectedUnit.unitName || "")
                                                    form.setValue("fromKol", selectedUnit.onHolder || "")
                                                }
                                            }}
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors text-neutral-200">
                                                    <SelectValue placeholder="Select IMEI to return" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors max-h-60">
                                                {loanedItems.map((item) => (
                                                    <SelectItem key={item.imei} value={item.imei || "unknown"} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer transition-colors">
                                                        {item.imei} - {item.unitName} - {item.onHolder || "Unknown KOL"}
                                                    </SelectItem>
                                                ))}
                                                {loanedItems.length === 0 && (
                                                    <div className="p-2 text-sm text-neutral-500 text-center">No loaned items found</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* Unit Name (Read Only if IMEI selected) */}
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* From KOL Name */}
                            <FormField
                                control={form.control}
                                name="fromKol"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">From KOL</FormLabel>
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

                            {/* Type of FOC */}
                            <FormField
                                control={form.control}
                                name="typeOfFoc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Type of FOC</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors text-neutral-200">
                                                    <SelectValue placeholder="Select FOC Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                {["ACCESORIES", "APS", "BUDS", "HANDPHONE", "PACKAGES", "RUGGED", "TAB", "WEARABLES"].map((type) => (
                                                    <SelectItem key={type} value={type} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer transition-colors">
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                                placeholder="Full return address context or notes"
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
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all mt-6">
                            {isSubmitting ? "Submitting Return..." : "Submit Return"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
