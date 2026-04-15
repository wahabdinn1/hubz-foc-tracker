"use client";

import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAMPAIGNS, REQUESTORS } from "@/lib/constants";
import { UsernameEmailInput } from "../shared/UsernameEmailInput";

export function RequestFormCampaign() {
    const form = useFormContext();
    const [campaignOpen, setCampaignOpen] = useState(false);
    const watchRequestor = useWatch({ name: "requestor" });
    const watchCampaign = useWatch({ name: "campaignName" });

    return (
        <>
            {/* Campaign Name (Full Width) */}
            <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                    <FormItem className="md:col-span-2 flex flex-col">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Campaign Name</FormLabel>
                        <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal",
                                            !field.value && "text-neutral-500"
                                        )}
                                    >
                                        {field.value
                                            ? CAMPAIGNS.find((campaign) => campaign === field.value)
                                            : "Select Campaign"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search campaign..." />
                                    <CommandList>
                                        <CommandEmpty>No campaign found.</CommandEmpty>
                                        <CommandGroup>
                                            {CAMPAIGNS.map((campaign) => (
                                                <CommandItem
                                                    key={campaign}
                                                    value={campaign}
                                                    onSelect={() => {
                                                        form.setValue("campaignName", campaign);
                                                        setCampaignOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            campaign === field.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {campaign}
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

            {/* Conditional Custom Campaign */}
            {watchCampaign === "Other" && (
                <FormField
                    control={form.control}
                    name="customCampaign"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Custom Campaign Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter custom campaign name" className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500" {...field} />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />
            )}

            {/* Username with Suffix (Full Width) */}
            <div className="md:col-span-2">
                <UsernameEmailInput />
            </div>

            {/* Requestor Select */}
            <FormField
                control={form.control}
                name="requestor"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">Requestor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                    <SelectValue placeholder="Select Requestor" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                {REQUESTORS.map((req) => (
                                    <SelectItem key={req} value={req} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer">
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
        </>
    );
}
