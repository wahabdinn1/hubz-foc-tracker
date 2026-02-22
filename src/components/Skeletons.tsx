import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn("group flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border bg-white/80 dark:bg-neutral-950/40 border-black/5 dark:border-white/[0.05] shadow-sm dark:shadow-none animate-pulse", className)}>
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="min-w-0 flex flex-col items-start gap-2">
                    <Skeleton className="h-5 w-32" />
                    <div className="hidden sm:flex gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
    );
}

export function SkeletonList({ count = 5, className }: { count?: number, className?: string }) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="w-full h-full space-y-6 md:space-y-8 pb-10 p-4 md:p-10 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 md:h-10 w-48 md:w-64" />
                    <Skeleton className="h-4 w-32 md:w-48" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-10 w-24 rounded-xl hidden sm:block" />
                    <Skeleton className="h-10 w-24 rounded-xl hidden sm:block" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-white/80 dark:bg-neutral-950/40 rounded-2xl md:rounded-3xl p-4 md:p-6 h-[350px] md:h-[420px] flex flex-col gap-6 border border-black/5 dark:border-white/5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56 hidden sm:block" /></div>
                    </div>
                    <SkeletonList count={4} />
                </div>
                <div className="bg-white/80 dark:bg-neutral-950/40 rounded-2xl md:rounded-3xl p-4 md:p-6 h-[350px] md:h-[420px] flex flex-col gap-6 border border-black/5 dark:border-white/5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56 hidden sm:block" /></div>
                    </div>
                    <SkeletonList count={4} />
                </div>
            </div>
        </div>
    );
}
