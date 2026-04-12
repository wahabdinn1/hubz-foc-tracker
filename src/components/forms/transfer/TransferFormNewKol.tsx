"use client"

import { useFormContext } from "react-hook-form"
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function TransferFormNewKol() {
    const form = useFormContext()

    return (
        <>
            <FormField
                control={form.control}
                name="kol2Name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            KOL 2 Name
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="New holder's name"
                                className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="kol2Phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            KOL 2 Phone Number
                        </FormLabel>
                        <FormControl>
                            <Input
                                placeholder="0812xxxxxxx"
                                className="bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 transition-colors focus-visible:ring-blue-500"
                                {...field}
                            />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="kol2Address"
                render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel className="text-neutral-700 dark:text-neutral-300 transition-colors">
                            KOL 2 Address
                        </FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Full delivery address for the new KOL"
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
    )
}
