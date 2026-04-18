"use client"

import { useFormContext } from "react-hook-form"
import { ArrowLeftRight, CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { FOC_TYPES } from "@/lib/constants"
import { useState } from "react"
import { useDropdownOptions } from "@/hooks/useDropdownOptions"

export function TransferFormDetails() {
    const form = useFormContext()
    const watchCampaign = form.watch("campaignName")
    const [datePopoverOpen, setDatePopoverOpen] = useState(false)
    const [campaignPopoverOpen, setCampaignPopoverOpen] = useState(false)

    const { options: campaignOptions, isLoading: loadingCampaigns } = useDropdownOptions("CAMPAIGN");
    const displayCampaigns = [...new Set([...campaignOptions.map(o => o.value), "Other"])];

    return (
        <>
            <FormField
                control={form.control}
                name="typeOfFoc"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            Type of FOC
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                                <SelectTrigger className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors">
                                    <SelectValue placeholder="Select FOC Type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 transition-colors">
                                {FOC_TYPES.map((type) => (
                                    <SelectItem
                                        key={type}
                                        value={type}
                                        className="hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white transition-colors cursor-pointer"
                                    >
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4" />
                    New Holder (KOL 2)
                </h3>
            </div>

            <FormField
                control={form.control}
                name="transferDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            Transfer Date
                        </FormLabel>
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
                            <PopoverContent
                                className="w-auto p-0 bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors"
                                align="start"
                            >
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                        field.onChange(date);
                                        setDatePopoverOpen(false);
                                    }}
                                    disabled={(date) => date < new Date("1900-01-01")}
                                    autoFocus
                                    className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-md border-neutral-200 dark:border-neutral-800"
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            Transfer Reason / Campaign
                        </FormLabel>
                        <Popover open={campaignPopoverOpen} onOpenChange={setCampaignPopoverOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        disabled={loadingCampaigns}
                                        className={cn(
                                            "w-full justify-between bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors font-normal",
                                            !field.value && "text-neutral-500"
                                        )}
                                    >
                                        {loadingCampaigns ? "Loading campaigns..." : (field.value
                                            ? displayCampaigns.find((campaign) => campaign === field.value)
                                            : "Select Campaign")}
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
                                            {displayCampaigns.map((campaign) => (
                                                <CommandItem
                                                    key={campaign}
                                                    value={campaign}
                                                    onSelect={() => {
                                                        form.setValue("campaignName", campaign)
                                                        setCampaignPopoverOpen(false)
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

            {watchCampaign === "Other" && (
                <FormField
                    control={form.control}
                    name="customCampaign"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                                Custom Campaign Name
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter custom campaign name"
                                    className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                        </FormItem>
                    )}
                />
            )}
        </>
    )
}
