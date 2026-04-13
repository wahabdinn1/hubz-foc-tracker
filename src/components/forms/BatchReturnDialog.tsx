"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { returnUnits } from "@/server/mutations";
import { REQUESTORS, FOC_TYPES } from "@/lib/constants";
import type { InventoryItem } from "@/types/inventory";
import type { ReturnPayload } from "@/lib/validations";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const batchReturnSchema = z.object({
    username: z.string().min(1, "Username is required"),
    requestor: z.string().min(1, "Requestor is required"),
    customRequestor: z.string().optional(),
    typeOfFoc: z.string().min(1, "Type of FOC is required"),
});

type BatchReturnValues = z.infer<typeof batchReturnSchema>;

interface BatchReturnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: InventoryItem[];
    onSuccess: () => void;
}

export function BatchReturnDialog({ open, onOpenChange, items, onSuccess }: BatchReturnDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<BatchReturnValues>({
        resolver: zodResolver(batchReturnSchema),
        defaultValues: {
            username: "",
            requestor: "",
            customRequestor: "",
            typeOfFoc: "",
        },
    });

    const watchRequestor = form.watch("requestor");

    async function onSubmit(values: BatchReturnValues) {
        setIsSubmitting(true);

        // Build array of ReturnPayload
        const payloadArray: ReturnPayload[] = items.map((item) => ({
            username: values.username,
            requestor: values.requestor,
            customRequestor: values.customRequestor,
            typeOfFoc: values.typeOfFoc,
            unitName: item.unitName || "Unknown Unit",
            imei: item.imei || "",
            fromKol: item.onHolder || item.fullData?.["PIC Request"] || "Unknown KOL",
            kolAddress: item.fullData?.["Alamat"] || "Unknown Address",
            kolPhoneNumber: item.fullData?.["No HP"] || "0000000000",
        }));

        toast.success(`Logging returns for ${items.length} units...`);
        
        // Let UI respond fast
        onOpenChange(false);
        form.reset();

        try {
            const result = await returnUnits(payloadArray);
            if (result.success) {
                toast.success(`Successfully batch returned ${items.length} units.`);
                onSuccess();
                router.refresh();
            } else {
                toast.error("Batch return failed", {
                    description: result.error,
                });
            }
        } catch {
            toast.error("Network error", {
                description: "Could not reach the server.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                <DialogHeader>
                    <DialogTitle>Batch Return Devices</DialogTitle>
                    <DialogDescription>
                        You are returning {items.length} device{items.length > 1 ? "s" : ""}. 
                        Fill in the details below to complete the return.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300">Username (Prefix)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. j.doe"
                                                {...field}
                                                className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="requestor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300">Requestor</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                                    <SelectValue placeholder="Select team..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {REQUESTORS.map(req => (
                                                    <SelectItem key={req} value={req}>{req}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {watchRequestor === "Other" && (
                                <FormField
                                    control={form.control}
                                    name="customRequestor"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-neutral-700 dark:text-neutral-300">Specify other team</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter team name"
                                                    {...field}
                                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="typeOfFoc"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                        <FormLabel className="text-neutral-700 dark:text-neutral-300">Type of FOC</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                                                    <SelectValue placeholder="Select type..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {FOC_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <ul className="text-sm border border-neutral-200 dark:border-neutral-800 rounded-md p-2 bg-neutral-50 dark:bg-neutral-950 max-h-32 overflow-y-auto">
                           {items.map((item, idx) => (
                               <li key={idx} className="flex justify-between items-center py-1 border-b border-neutral-200 dark:border-neutral-800 last:border-0 text-neutral-600 dark:text-neutral-400">
                                   <span>{item.unitName}</span>
                                   <span className="font-mono text-xs">{item.imei}</span>
                               </li>
                           ))}
                        </ul>

                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => onOpenChange(false)}
                                className="border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isSubmitting ? "Returning..." : `Return ${items.length} items`}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
