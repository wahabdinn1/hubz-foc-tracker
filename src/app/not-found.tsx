import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Page not found</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                    The page you are looking for does not exist or has been moved.
                </p>
            </div>
            <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
                Back to Dashboard
            </Link>
        </div>
    )
}
