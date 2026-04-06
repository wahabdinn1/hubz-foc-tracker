"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RequestFormKol() {
    const form = useFormContext();

    return (
        <>
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

            {/* KOL Phone Number (same row as KOL Name) */}
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
        </>
    );
}
