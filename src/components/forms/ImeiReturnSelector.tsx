"use client";

import { useFormContext } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import type { InventoryItem } from "@/types/inventory";
import { REQUESTORS, FOC_TYPES } from "@/lib/constants";

interface ImeiReturnSelectorProps {
    loanedItems: InventoryItem[];
}

export function ImeiReturnSelector({ loanedItems }: ImeiReturnSelectorProps) {
    const form = useFormContext(); // Assumes it is wrapped in <Form>

    return (
        <FormField
            control={form.control}
            name="imei"
            render={({ field }) => (
                <FormItem className="md:col-span-2 flex flex-col">
                    <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">IMEI/SN - Unit Name - KOL Holder</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal whitespace-pre-wrap h-auto min-h-[40px] text-left",
                                        !field.value && "text-neutral-500 dark:text-neutral-400"
                                    )}
                                >
                                    {field.value
                                        ? (() => {
                                            const item = loanedItems.find(i => i.imei === field.value);
                                            return item ? `${item.imei} - ${item.unitName} - ${item.onHolder || "Unknown KOL"}` : field.value;
                                        })()
                                        : "Select IMEI to return"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search IMEI or Unit Name..." />
                                <CommandList>
                                    <CommandEmpty>No loaned items found.</CommandEmpty>
                                    <CommandGroup>
                                        {loanedItems.map((item) => (
                                            <CommandItem
                                                value={`${item.imei} ${item.unitName} ${item.onHolder}`}
                                                key={item.imei}
                                                onSelect={() => {
                                                    field.onChange(item.imei);
                                                    form.setValue("unitName", item.unitName || "");
                                                    form.setValue("fromKol", item.onHolder || "");

                                                    const phone = item.fullData?.["Step 3 Phone"] || item.fullData?.["KOL Phone Number"] || item.fullData?.["Phone Number"] || "";
                                                    const address = item.fullData?.["Step 3 Address"] || item.fullData?.["KOL Address"] || item.fullData?.["Address"] || "";
                                                    form.setValue("kolPhoneNumber", phone);
                                                    form.setValue("kolAddress", address);

                                                    const requestor = item.fullData?.["Step 3 Requestor"];
                                                    if (requestor) {
                                                        const predefinedReq = REQUESTORS.filter(r => r !== "Other");
                                                        const matchedReq = predefinedReq.find(r => r.toLowerCase() === requestor.toLowerCase());
                                                        if (matchedReq) {
                                                            form.setValue("requestor", matchedReq);
                                                            form.setValue("customRequestor", "");
                                                        } else {
                                                            form.setValue("requestor", "Other");
                                                            form.setValue("customRequestor", requestor);
                                                        }
                                                    }

                                                    const typeOfFoc = item.fullData?.["Step 3 Type of FOC"];
                                                    if (typeOfFoc) {
                                                        const predefinedFoc = [...FOC_TYPES];
                                                        const mappedType = typeOfFoc.toUpperCase();
                                                        const matchedFoc = predefinedFoc.find(f => f === mappedType);
                                                        if (matchedFoc) {
                                                            form.setValue("typeOfFoc", matchedFoc as any);
                                                        }
                                                    }
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        item.imei === field.value ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {item.imei} - {item.unitName} - {item.onHolder || "Unknown KOL"}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage className="text-red-400" />
                </FormItem>
            )}
        />
    );
}
