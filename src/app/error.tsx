"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("[App Error]", error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3" role="alert">
                    Something went wrong
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                    An unexpected error occurred. Please try again or refresh the page.
                </p>
            </div>
            <Button
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
            >
                <RotateCw className="w-5 h-5" aria-hidden="true" />
                Try again
            </Button>
        </div>
    )
}
