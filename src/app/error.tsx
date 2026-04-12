"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"

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
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Something went wrong</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                    An unexpected error occurred. Please try again or refresh the page.
                </p>
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
                <RotateCw className="w-4 h-4" />
                Try again
            </button>
        </div>
    )
}
