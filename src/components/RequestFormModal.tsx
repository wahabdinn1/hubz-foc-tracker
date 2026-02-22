"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { requestUnit, InventoryItem, RequestPayload } from "../../server/actions"

const formSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    campaignName: z.string().min(1, "Campaign is required"),
    unitName: z.string().min(1, "Unit Name is required"),
    imeiIfAny: z.string().optional(),
    kolName: z.string().min(1, "KOL Name is required"),
    kolAddress: z.string().min(1, "KOL Address is required"),
    kolPhoneNumber: z.string().min(1, "Phone Number is required"),
    deliveryDate: z.date(),
    typeOfDelivery: z.string().min(1, "Type of Delivery is required"),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
})

export function RequestFormModal({ availableItems }: { availableItems: InventoryItem[] }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema as any),
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

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)

        const payload: RequestPayload = {
            ...values,
            deliveryDate: format(values.deliveryDate, "yyyy-MM-dd"), // format string for server action
        }

        const result = await requestUnit(payload)

        setIsSubmitting(false)

        if (result.success) {
            toast.success("Unit requested successfully!")
            form.reset()
            setOpen(false)
            router.refresh()
        } else {
            toast.error("Failed to submit request", {
                description: result.error,
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                                name="imeiIfAny"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">IMEI/SN - Unit Name</FormLabel>
                                        <Select
                                            onValueChange={(val) => {
                                                field.onChange(val === "none" ? "" : val)
                                                // Sync Unit Name field
                                                const selectedUnit = availableItems.find(item => item.imei === val)
                                                if (selectedUnit) {
                                                    form.setValue("unitName", selectedUnit.unitName)
                                                } else if (val === "none") {
                                                    form.setValue("unitName", "")
                                                }
                                            }}
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors text-neutral-200">
                                                    <SelectValue placeholder="Select IMEI if exact unit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors max-h-60">
                                                <SelectItem value="none" className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer transition-colors italic">
                                                    None (Define manually)
                                                </SelectItem>
                                                {availableItems.map((item) => (
                                                    <SelectItem key={item.imei} value={item.imei || "unknown"} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer transition-colors">
                                                        {item.imei} - {item.unitName}
                                                    </SelectItem>
                                                ))}
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
                                    <FormItem className="flex flex-col mt-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Delivery Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors text-neutral-200 hover:bg-neutral-900",
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
                                    <FormItem className="mt-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Type of Delivery</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors text-neutral-200">
                                                    <SelectValue placeholder="Select Delivery" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                                {["BLUEBIRD", "TIKI"].map((type) => (
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
