"use client";

import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DELIVERY_TYPES, FOC_TYPES } from "@/lib/constants";

interface RequestFormDeliveryProps {
    autoFilledFoc: string | null;
}

export function RequestFormDelivery({ autoFilledFoc }: RequestFormDeliveryProps) {
    const form = useFormContext();
    const watchTypeOfFoc = useWatch({ name: "typeOfFoc" });
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);

    return (
        <>
            {/* Delivery Date */}
            <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Delivery Date</FormLabel>
                        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
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
                                    onSelect={(date) => {
                                        field.onChange(date);
                                        setDatePopoverOpen(false);
                                    }}
                                    disabled={(date) =>
                                        date < new Date("1900-01-01")
                                    }
                                    autoFocus
                                    className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-md border-neutral-200 dark:border-neutral-800"
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
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Type of Delivery</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                    <SelectValue placeholder="Select Delivery" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                {DELIVERY_TYPES.map((type) => (
                                    <SelectItem key={type} value={type} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer">
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            {/* Type of FOC (auto-filled from category, still editable) */}
            <FormField
                control={form.control}
                name="typeOfFoc"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Type of FOC</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                    <SelectValue placeholder="Select FOC Type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                {FOC_TYPES.map((type) => (
                                    <SelectItem key={type} value={type} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer">
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {autoFilledFoc && watchTypeOfFoc === autoFilledFoc && (
                            <p className="text-xs text-blue-500 mt-1">Auto-filled from spreadsheet data</p>
                        )}
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />
        </>
    );
}
