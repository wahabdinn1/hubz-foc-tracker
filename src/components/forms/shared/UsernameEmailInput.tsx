"use client"

import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { EMAIL_DOMAIN } from "@/lib/constants"

export function UsernameEmailInput() {
    const form = useFormContext()

    return (
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
                                {EMAIL_DOMAIN}
                            </span>
                        </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                </FormItem>
            )}
        />
    )
}
